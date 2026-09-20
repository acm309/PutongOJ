import type Router from '@koa/router'
import type { AdminUserBatchRegisterResult } from '@putong-oj/shared'
import type { Context } from 'koa'
import {
  AdminUserBatchRegisterPayloadSchema,
  AdminUserBatchRegisterResultSchema,
  AdminUserChangePasswordPayloadSchema,
  AdminUserDetailQueryResultSchema,
  AdminUserEditPayloadSchema,
  AdminUserListQueryResultSchema,
  AdminUserListQuerySchema,
  AdminUserOAuthQueryResultSchema,
  ErrorCode,
  SessionListQueryResultSchema,
  SessionRevokeOthersResultSchema,
} from '@putong-oj/shared'
import { loadProfile, rootRequire } from '../../middlewares/authn.ts'
import cryptoService from '../../services/crypto.ts'
import oauthService from '../../services/oauth.ts'
import sessionService from '../../services/session.ts'
import userService from '../../services/user.ts'
import {
  createEnvelopedResponse,
  createErrorResponse,
  createZodErrorResponse,
  isComplexPwd,
  passwordHash,
} from '../../utils/index.ts'
import { providerMap } from '../oauth.ts'
import { loadUser } from '../user.ts'

async function loadEditingUser (ctx: Context) {
  const user = await loadUser(ctx)
  const profile = await loadProfile(ctx)
  if (!profile.isRoot && profile.privilege <= user.privilege && profile.uid !== user.uid) {
    createErrorResponse(ctx, ErrorCode.Forbidden, 'Insufficient privilege to edit this user')
    return null
  }
  return user
}

export async function findUsers (ctx: Context) {
  const query = AdminUserListQuerySchema.safeParse(ctx.request.query)
  if (!query.success) {
    return createZodErrorResponse(ctx, query.error)
  }

  const users = await userService.findUsers(query.data)
  const result = AdminUserListQueryResultSchema.encode(users)
  return createEnvelopedResponse(ctx, result)
}

export async function getUser (ctx: Context) {
  const user = await loadUser(ctx)
  const result = AdminUserDetailQueryResultSchema.encode(user)
  return createEnvelopedResponse(ctx, result)
}

export async function updateUser (ctx: Context) {
  const payload = AdminUserEditPayloadSchema.safeParse(ctx.request.body)
  if (!payload.success) {
    return createZodErrorResponse(ctx, payload.error)
  }

  const user = await loadEditingUser(ctx)
  if (!user) {
    return
  }

  const profile = await loadProfile(ctx)
  if (payload.data.privilege !== undefined) {
    if (profile.uid === user.uid) {
      return createErrorResponse(ctx, ErrorCode.Forbidden, 'Cannot change your own privilege')
    }
    if (!profile.isRoot && profile.privilege <= payload.data.privilege) {
      return createErrorResponse(ctx, ErrorCode.Forbidden, 'Cannot elevate user privilege to equal or higher than yourself')
    }
  }
  if (payload.data.avatar !== undefined && !profile.isRoot) {
    return createErrorResponse(ctx, ErrorCode.Forbidden, 'Only root administrators can change user avatars')
  }

  try {
    const { privilege, nick, avatar, motto, school, mail, storageQuota } = payload.data
    const updatedUser = await userService.updateUser(user, {
      privilege, nick, avatar, motto, school, mail, storageQuota,
    })
    const result = AdminUserDetailQueryResultSchema.encode(updatedUser)
    ctx.auditLog.info(`<User:${user.uid}> updated by <User:${profile.uid}>`)
    return createEnvelopedResponse(ctx, result)
  } catch (err) {
    ctx.auditLog.error('Failed to update user', err)
    return createErrorResponse(ctx, ErrorCode.InternalServerError)
  }
}

export async function updateUserPassword (ctx: Context) {
  const payload = AdminUserChangePasswordPayloadSchema.safeParse(ctx.request.body)
  if (!payload.success) {
    return createZodErrorResponse(ctx, payload.error)
  }
  let password: string | undefined
  try {
    password = await cryptoService.decryptData(payload.data.newPassword)
  } catch {
    return createErrorResponse(ctx, ErrorCode.BadRequest, 'Failed to decrypt password field')
  }
  if (!isComplexPwd(password)) {
    return createErrorResponse(ctx, ErrorCode.BadRequest, 'Password is not complex enough')
  }
  const pwd = passwordHash(password)

  const user = await loadEditingUser(ctx)
  if (!user) {
    return
  }

  const profile = await loadProfile(ctx)
  try {
    await userService.updateUser(user, { pwd })
    const revoked = await sessionService.revokeOtherSessions(user._id.toString(), '')
    ctx.auditLog.info(`<User:${user.uid}> password reset by <User:${profile.uid}>, revoked ${revoked} session(s)`)
    return createEnvelopedResponse(ctx, null)
  } catch (err) {
    ctx.auditLog.error('Failed to update user password', err)
    return createErrorResponse(ctx, ErrorCode.InternalServerError)
  }
}

export async function batchRegisterUsers (ctx: Context) {
  const payload = AdminUserBatchRegisterPayloadSchema.safeParse(ctx.request.body)
  if (!payload.success) {
    return createZodErrorResponse(ctx, payload.error)
  }
  const users = payload.data

  const results: AdminUserBatchRegisterResult['results'] = []
  let created = 0

  for (const item of users) {
    const username = item.username
    const password = item.password

    if (!isComplexPwd(password)) {
      results.push({
        username,
        success: false,
        message: 'Password is not complex enough',
      })
      continue
    }

    const available = await userService.checkUserAvailable(username)
    if (!available) {
      results.push({
        username,
        success: false,
        message: 'The username has been registered or reserved',
      })
      continue
    }

    try {
      await userService.createUser({
        uid: username,
        pwd: passwordHash(password),
        nick: item.nick,
      })
      created += 1
      results.push({
        username,
        success: true,
      })
    } catch (err) {
      ctx.auditLog.error(`Failed to batch register <User:${username}>`, err)
      results.push({
        username,
        success: false,
        message: 'Failed to create user',
      })
    }
  }

  const profile = await loadProfile(ctx)
  ctx.auditLog.info(`Batch register completed by <User:${profile.uid}>, created ${created}/${users.length} users`)

  const result = AdminUserBatchRegisterResultSchema.parse({
    total: users.length,
    created,
    failed: users.length - created,
    results,
  })
  return createEnvelopedResponse(ctx, result)
}

export async function getUserOAuthConnections (ctx: Context) {
  const user = await loadUser(ctx)
  const connections = await oauthService.getUserOAuthConnections(user._id)
  const result = AdminUserOAuthQueryResultSchema.encode(connections)
  return createEnvelopedResponse(ctx, result)
}

export async function removeUserOAuthConnection (ctx: Context) {
  const providerName = ctx.params.provider
  if (typeof providerName !== 'string' || !(providerName in providerMap)) {
    return createErrorResponse(ctx, ErrorCode.BadRequest, 'No such OAuth provider')
  }
  const provider = providerMap[providerName as keyof typeof providerMap]

  const user = await loadEditingUser(ctx)
  if (!user) {
    return
  }

  const result = await oauthService.removeOAuthConnection(user._id, provider)
  if (!result) {
    return createErrorResponse(ctx, ErrorCode.NotFound)
  } else {
    const profile = await loadProfile(ctx)
    ctx.auditLog.info(`<User:${user.uid}> removed ${provider} OAuth connection by <User:${profile.uid}>`)
    return createEnvelopedResponse(ctx, null)
  }
}

export async function listUserSessions (ctx: Context) {
  const user = await loadUser(ctx)
  const sessions = await sessionService.listSessions(user._id.toString())

  const currentSessionId = ctx.state.sessionId
  const result = SessionListQueryResultSchema.parse(sessions.map(s => ({
    sessionId: s.sessionId,
    current: s.sessionId === currentSessionId,
    lastAccessAt: s.lastAccessAt,
    loginAt: s.info.loginAt,
    loginIp: s.info.loginIp,
    userAgent: s.info.userAgent,
  })))
  return createEnvelopedResponse(ctx, result)
}

export async function revokeUserSession (ctx: Context) {
  const user = await loadEditingUser(ctx)
  if (!user) {
    return
  }

  const profile = await loadProfile(ctx)
  const { sessionId } = ctx.params
  if (!sessionId || typeof sessionId !== 'string') {
    return createErrorResponse(ctx, ErrorCode.BadRequest, 'Invalid session ID')
  }
  if (sessionId === ctx.state.sessionId) {
    return createErrorResponse(ctx, ErrorCode.BadRequest, 'Cannot revoke current session, use logout instead')
  }

  await sessionService.revokeSession(user._id.toString(), sessionId)
  ctx.auditLog.info(`<User:${profile.uid}> revoked <Session:${sessionId}> of <User:${user.uid}>`)
  return createEnvelopedResponse(ctx, null)
}

export async function revokeUserAllSessions (ctx: Context) {
  const user = await loadEditingUser(ctx)
  if (!user) {
    return
  }

  const profile = await loadProfile(ctx)

  const keepSessionId = user.uid === profile.uid ? ctx.state.sessionId : ''
  const removed = await sessionService.revokeOtherSessions(user._id.toString(), keepSessionId || '')
  ctx.auditLog.info(`<User:${profile.uid}> revoked all ${removed} session(s) of <User:${user.uid}>`)
  const result = SessionRevokeOthersResultSchema.parse({ removed })
  return createEnvelopedResponse(ctx, result)
}

function registerAdminUserHandlers (router: Router) {
  router.get('/users', findUsers)
  router.get('/users/:uid', getUser)
  router.put('/users/:uid', updateUser)
  router.put('/users/:uid/password', updateUserPassword)
  router.post('/users/batch-register', rootRequire, batchRegisterUsers)
  router.get('/users/:uid/oauth', getUserOAuthConnections)
  router.delete('/users/:uid/oauth/:provider', removeUserOAuthConnection)
  router.get('/users/:uid/sessions', listUserSessions)
  router.delete('/users/:uid/sessions', revokeUserAllSessions)
  router.delete('/users/:uid/sessions/:sessionId', revokeUserSession)
}

export default registerAdminUserHandlers
