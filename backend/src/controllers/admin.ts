import type { Context } from 'koa'
import {
  AdminUserDetailQueryResultSchema,
  AdminUserEditPayloadSchema,
  AdminUserListQueryResultSchema,
  AdminUserListQuerySchema,
  ErrorCode,
} from '@putongoj/shared'
import { loadProfile } from '../middlewares/authn'
import cryptoService from '../services/crypto'
import userServices from '../services/user'
import {
  createEnvelopedResponse,
  createErrorResponse,
  createZodErrorResponse,
  isComplexPwd,
  passwordHash,
} from '../utils'
import { loadUser } from './user'

export async function findUsers (ctx: Context) {
  const query = AdminUserListQuerySchema.safeParse(ctx.request.query)
  if (!query.success) {
    return createZodErrorResponse(ctx, query.error)
  }

  const users = await userServices.findUsers(query.data)
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
  let password: string | undefined
  if (payload.data.password) {
    try {
      password = await cryptoService.decryptData(payload.data.password)
    } catch {
      return createErrorResponse(ctx,
        'Failed to decrypt password field', ErrorCode.BadRequest,
      )
    }
  }
  let pwd: string | undefined
  if (password !== undefined) {
    if (!isComplexPwd(password)) {
      return createErrorResponse(ctx,
        'Password is not complex enough', ErrorCode.BadRequest,
      )
    }
    pwd = passwordHash(password)
  }

  const user = await loadUser(ctx)
  const profile = await loadProfile(ctx)
  if (profile.privilege < user.privilege) {
    return createErrorResponse(ctx,
      'Insufficient privilege to edit this user', ErrorCode.Forbidden,
    )
  }
  if (payload.data.privilege !== undefined) {
    if (profile.uid === user.id) {
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
    const updatedUser = await userServices.updateUser(user, {
      privilege, nick, motto, school, mail, pwd,
    })
    const result = AdminUserDetailQueryResultSchema.encode(updatedUser)
    return createEnvelopedResponse(ctx, result)
  } catch (err: any) {
    return createErrorResponse(ctx, err.message, ErrorCode.InternalServerError)
  }
}

const adminController = {
  findUsers,
  getUser,
  updateUser,
} as const

export default adminController
