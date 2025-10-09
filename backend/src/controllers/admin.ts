import type { Context } from 'koa'
import {
  AdminUserChangePasswordPayloadSchema,
  AdminUserDetailQueryResultSchema,
  AdminUserEditPayloadSchema,
  AdminUserListQueryResultSchema,
  AdminUserListQuerySchema,
  AdminUserOAuthQueryResultSchema,
  ErrorCode,
  OAuthProvider,
} from '@putongoj/shared'
import { loadProfile } from '../middlewares/authn'
import cryptoService from '../services/crypto'
import oauthService from '../services/oauth'
import userService from '../services/user'
import {
  createEnvelopedResponse,
  createErrorResponse,
  createZodErrorResponse,
  isComplexPwd,
  passwordHash,
} from '../utils'
import { loadUser } from './user'

async function loadEditingUser (ctx: Context) {
  const user = await loadUser(ctx)
  const profile = await loadProfile(ctx)
  if (!profile.isRoot && profile.privilege <= user.privilege && profile.uid !== user.uid) {
    createErrorResponse(ctx,
      'Insufficient privilege to edit this user', ErrorCode.Forbidden,
    )
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
      return createErrorResponse(ctx,
        'Cannot change your own privilege', ErrorCode.Forbidden,
      )
    }
    if (!profile.isRoot && profile.privilege <= payload.data.privilege) {
      return createErrorResponse(ctx,
        'Cannot elevate user privilege to equal or higher than yourself', ErrorCode.Forbidden,
      )
    }
  }

  try {
    const { privilege, nick, motto, school, mail } = payload.data
    const updatedUser = await userService.updateUser(user, {
      privilege, nick, motto, school, mail,
    })
    const result = AdminUserDetailQueryResultSchema.encode(updatedUser)
    return createEnvelopedResponse(ctx, result)
  } catch (err: any) {
    return createErrorResponse(ctx, err.message, ErrorCode.InternalServerError)
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
    return createErrorResponse(ctx,
      'Failed to decrypt password field', ErrorCode.BadRequest,
    )
  }
  if (!isComplexPwd(password)) {
    return createErrorResponse(ctx,
      'Password is not complex enough', ErrorCode.BadRequest,
    )
  }
  const pwd = passwordHash(password)

  const user = await loadEditingUser(ctx)
  if (!user) {
    return
  }

  try {
    await userService.updateUser(user, { pwd })
    return createEnvelopedResponse(ctx, null)
  } catch (err: any) {
    return createErrorResponse(ctx, err.message, ErrorCode.InternalServerError)
  }
}

export async function getUserOAuthConnections (ctx: Context) {
  const user = await loadUser(ctx)
  const connections = await oauthService.getUserOAuthConnections(user._id)
  const result = AdminUserOAuthQueryResultSchema.encode(connections)
  return createEnvelopedResponse(ctx, result)
}

export async function removeUserOAuthConnection (ctx: Context) {
  const providerMap: Record<string, OAuthProvider> = {
    cjlu: OAuthProvider.CJLU,
  }
  const providerName = ctx.params.provider
  if (typeof providerName !== 'string' || !(providerName in providerMap)) {
    return createErrorResponse(ctx,
      'No such OAuth provider', ErrorCode.BadRequest,
    )
  }
  const provider = providerMap[providerName as keyof typeof providerMap]
  const user = await loadEditingUser(ctx)
  if (!user) {
    return
  }
  const result = await oauthService.removeOAuthConnection(user._id, provider)
  if (!result) {
    return createErrorResponse(ctx,
      'No such OAuth connection', ErrorCode.NotFound,
    )
  } else {
    return createEnvelopedResponse(ctx, null)
  }
}

const adminController = {
  findUsers,
  getUser,
  updateUser,
  updateUserPassword,
  getUserOAuthConnections,
  removeUserOAuthConnection,
} as const

export default adminController
