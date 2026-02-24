import type { Context } from 'koa'
import { Buffer } from 'node:buffer'
import { timingSafeEqual } from 'node:crypto'
import {
  AccountChangePasswordPayloadSchema,
  AccountEditPayloadSchema,
  AccountLoginPayloadSchema,
  AccountProfileQueryResultSchema,
  AccountRegisterPayloadSchema,
  AccountSubmissionListQueryResultSchema,
  AccountSubmissionListQuerySchema,
  ErrorCode,
  SessionListQueryResultSchema,
  SessionRevokeOthersResultSchema,
  UserPrivilege,
} from '@putongoj/shared'
import { checkSession, loadProfile } from '../middlewares/authn'
import cryptoService from '../services/crypto'
import sessionService from '../services/session'
import solutionService from '../services/solution'
import userService from '../services/user'
import {
  createEnvelopedResponse,
  createErrorResponse,
  createZodErrorResponse,
  isComplexPwd,
  passwordHash,
  passwordHashBuffer,
} from '../utils'

export async function getProfile (ctx: Context) {
  const profile = await checkSession(ctx)
  if (!profile) {
    return createErrorResponse(ctx, ErrorCode.Unauthorized, 'Not logged in')
  }

  const result = AccountProfileQueryResultSchema.encode(profile.toObject())
  return createEnvelopedResponse(ctx, result)
}

export async function userLogin (ctx: Context) {
  const payload = AccountLoginPayloadSchema.safeParse(ctx.request.body)
  if (!payload.success) {
    return createZodErrorResponse(ctx, payload.error)
  }
  let password: string
  try {
    password = await cryptoService.decryptData(payload.data.password)
  } catch {
    return createErrorResponse(ctx, ErrorCode.BadRequest, 'Failed to decrypt password field')
  }
  const pwdHash = passwordHashBuffer(password)

  const user = await userService.getUser(payload.data.username)
  if (!user) {
    return createErrorResponse(ctx, ErrorCode.Unauthorized, 'Username or password is incorrect')
  }
  if (timingSafeEqual(Buffer.from(user.pwd, 'hex'), pwdHash) === false) {
    return createErrorResponse(ctx, ErrorCode.Unauthorized, 'Username or password is incorrect')
  }
  if (user.privilege === UserPrivilege.Banned) {
    return createErrorResponse(ctx, ErrorCode.Forbidden, 'Account has been banned, please contact the administrator')
  }

  const userId = user._id.toString()
  const sessionId = await sessionService.createSession(
    userId, ctx.state.clientIp, ctx.get('User-Agent') || '',
  )
  ctx.session.userId = userId
  ctx.session.sessionId = sessionId

  ctx.auditLog.info(`<User:${user.uid}> logged in successfully`)

  const result = AccountProfileQueryResultSchema.encode(user.toObject())
  return createEnvelopedResponse(ctx, result)
}

export async function userRegister (ctx: Context) {
  const profile = await checkSession(ctx)
  if (profile) {
    return createErrorResponse(ctx, ErrorCode.BadRequest, 'Already logged in')
  }

  const payload = AccountRegisterPayloadSchema.safeParse(ctx.request.body)
  if (!payload.success) {
    return createZodErrorResponse(ctx, payload.error)
  }
  let password: string
  try {
    password = await cryptoService.decryptData(payload.data.password)
  } catch {
    return createErrorResponse(ctx, ErrorCode.BadRequest, 'Failed to decrypt password field')
  }

  const available = await userService.checkUserAvailable(payload.data.username)
  if (!available) {
    return createErrorResponse(ctx, ErrorCode.Conflict, 'The username has been registered or reserved')
  }
  if (!isComplexPwd(password)) {
    return createErrorResponse(ctx, ErrorCode.BadRequest, 'Password is not complex enough')
  }

  try {
    const user = await userService.createUser({
      uid: payload.data.username,
      pwd: passwordHash(password),
    })
    const userId = user._id.toString()
    const sessionId = await sessionService.createSession(
      userId, ctx.state.clientIp, ctx.get('User-Agent') || '',
    )
    ctx.session.userId = userId
    ctx.session.sessionId = sessionId

    ctx.auditLog.info(`<User:${user.uid}> registered successfully`)

    const result = AccountProfileQueryResultSchema.encode(user.toObject())
    return createEnvelopedResponse(ctx, result)
  } catch (err) {
    ctx.auditLog.error('Failed to register user', err)
    return createErrorResponse(ctx, ErrorCode.InternalServerError)
  }
}

export async function userLogout (ctx: Context) {
  const { profile, sessionId } = ctx.state

  if (profile && sessionId) {
    await sessionService.revokeSession(profile._id.toString(), sessionId)
    ctx.auditLog.info(`<User:${profile.uid}> logged out`)
  }
  delete ctx.session.userId
  delete ctx.session.sessionId

  return createEnvelopedResponse(ctx, null)
}

export async function updateProfile (ctx: Context) {
  const profile = await loadProfile(ctx)
  const payload = AccountEditPayloadSchema.safeParse(ctx.request.body)
  if (!payload.success) {
    return createZodErrorResponse(ctx, payload.error)
  }

  try {
    const { nick, motto, mail, school } = payload.data
    const updatedUser = await userService.updateUser(profile, {
      nick, motto, mail, school,
    })
    const result = AccountProfileQueryResultSchema.encode(updatedUser.toObject())
    ctx.auditLog.info(`<User:${profile.uid}> updated profile`)
    return createEnvelopedResponse(ctx, result)
  } catch (err) {
    ctx.auditLog.error('Failed to update profile', err)
    return createErrorResponse(ctx, ErrorCode.InternalServerError)
  }
}

export async function updatePassword (ctx: Context) {
  const profile = await loadProfile(ctx)
  const payload = AccountChangePasswordPayloadSchema.safeParse(ctx.request.body)
  if (!payload.success) {
    return createZodErrorResponse(ctx, payload.error)
  }
  let oldPassword: string | undefined
  let newPassword: string | undefined
  try {
    oldPassword = await cryptoService.decryptData(payload.data.oldPassword)
    newPassword = await cryptoService.decryptData(payload.data.newPassword)
  } catch {
    return createErrorResponse(ctx, ErrorCode.BadRequest, 'Failed to decrypt password field')
  }

  if (!isComplexPwd(newPassword)) {
    return createErrorResponse(ctx, ErrorCode.BadRequest, 'New password is not complex enough')
  }
  const oldPwdHash = passwordHashBuffer(oldPassword)
  if (timingSafeEqual(Buffer.from(profile.pwd, 'hex'), oldPwdHash) === false) {
    return createErrorResponse(ctx, ErrorCode.Unauthorized, 'Old password is incorrect')
  }
  const pwd = passwordHash(newPassword)

  try {
    await userService.updateUser(profile, { pwd })
    const userId = profile._id.toString()
    const revoked = await sessionService.revokeOtherSessions(userId, ctx.state.sessionId!)
    ctx.auditLog.info(`<User:${profile.uid}> changed password, revoked ${revoked} other session(s)`)
    return createEnvelopedResponse(ctx, null)
  } catch (err) {
    ctx.auditLog.error('Failed to update password', err)
    return createErrorResponse(ctx, ErrorCode.InternalServerError)
  }
}

export async function findSubmissions (ctx: Context) {
  const profile = await loadProfile(ctx)
  const query = AccountSubmissionListQuerySchema.safeParse(ctx.request.query)
  if (!query.success) {
    return createZodErrorResponse(ctx, query.error)
  }

  const solutions = await solutionService
    .findSolutions({ ...query.data, user: profile.uid })
  const result = AccountSubmissionListQueryResultSchema.encode(solutions)
  return createEnvelopedResponse(ctx, result)
}

export async function listSessions (ctx: Context) {
  const profile = await loadProfile(ctx)
  const userId = profile._id.toString()
  const sessions = await sessionService.listSessions(userId)

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

export async function revokeSession (ctx: Context) {
  const profile = await loadProfile(ctx)
  const { sessionId } = ctx.params
  if (!sessionId || typeof sessionId !== 'string') {
    return createErrorResponse(ctx, ErrorCode.BadRequest, 'Invalid session ID')
  }
  if (sessionId === ctx.state.sessionId) {
    return createErrorResponse(ctx, ErrorCode.BadRequest, 'Cannot revoke current session, use logout instead')
  }

  await sessionService.revokeSession(profile._id.toString(), sessionId)
  ctx.auditLog.info(`<User:${profile.uid}> revoked <Session:${sessionId}>`)
  return createEnvelopedResponse(ctx, null)
}

export async function revokeOtherSessions (ctx: Context) {
  const profile = await loadProfile(ctx)
  const currentSessionId = ctx.state.sessionId
  if (!currentSessionId) {
    return createErrorResponse(ctx, ErrorCode.BadRequest, 'No active session')
  }

  const removed = await sessionService.revokeOtherSessions(
    profile._id.toString(), currentSessionId,
  )
  ctx.auditLog.info(`<User:${profile.uid}> revoked ${removed} other session(s)`)
  const result = SessionRevokeOthersResultSchema.parse({ removed })
  return createEnvelopedResponse(ctx, result)
}

const accountController = {
  getProfile,
  userLogin,
  userRegister,
  userLogout,
  updateProfile,
  updatePassword,
  findSubmissions,
  listSessions,
  revokeSession,
  revokeOtherSessions,
} as const

export default accountController
