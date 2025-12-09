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
import logger from '../utils/logger'

export async function getProfile (ctx: Context) {
  const profile = await checkSession(ctx)
  const session = sessionService.getSession(ctx)
  if (!profile || !session) {
    return createErrorResponse(ctx, 'Not logged in', ErrorCode.Unauthorized)
  }

  const result = AccountProfileQueryResultSchema.encode({
    ...session, ...profile.toObject(),
  })
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
    return createErrorResponse(ctx,
      'Failed to decrypt password field', ErrorCode.BadRequest,
    )
  }
  const pwdHash = passwordHashBuffer(password)

  const user = await userService.getUser(payload.data.username)
  if (!user) {
    return createErrorResponse(ctx,
      'Username or password is incorrect', ErrorCode.Unauthorized,
    )
  }
  if (timingSafeEqual(Buffer.from(user.pwd, 'hex'), pwdHash) === false) {
    return createErrorResponse(ctx,
      'Username or password is incorrect', ErrorCode.Unauthorized,
    )
  }
  if (user.privilege === UserPrivilege.Banned) {
    return createErrorResponse(ctx,
      'Account has been banned, please contact the administrator', ErrorCode.Forbidden,
    )
  }

  const session = sessionService.setSession(ctx, user)
  const result = AccountProfileQueryResultSchema.encode({
    ...session, ...user.toObject(),
  })
  logger.info(`User <User:${user.uid}> logged in successfully [${ctx.state.requestId}] from ${ctx.state.clientIp}`)
  return createEnvelopedResponse(ctx, result)
}

export async function userRegister (ctx: Context) {
  const profile = await checkSession(ctx)
  if (profile) {
    return createErrorResponse(ctx, 'Already logged in', ErrorCode.BadRequest)
  }

  const payload = AccountRegisterPayloadSchema.safeParse(ctx.request.body)
  if (!payload.success) {
    return createZodErrorResponse(ctx, payload.error)
  }
  let password: string
  try {
    password = await cryptoService.decryptData(payload.data.password)
  } catch {
    return createErrorResponse(ctx,
      'Failed to decrypt password field', ErrorCode.BadRequest,
    )
  }

  const available = await userService.checkUserAvailable(payload.data.username)
  if (!available) {
    return createErrorResponse(ctx,
      'The username has been registered or reserved', ErrorCode.Conflict,
    )
  }
  if (!isComplexPwd(password)) {
    return createErrorResponse(ctx,
      'Password is not complex enough', ErrorCode.BadRequest,
    )
  }

  try {
    const user = await userService.createUser({
      uid: payload.data.username,
      pwd: passwordHash(password),
    })
    const session = sessionService.setSession(ctx, user)
    const result = AccountProfileQueryResultSchema.encode({
      ...session, ...user.toObject(),
    })
    logger.info(`User <User:${user.uid}> registered successfully [${ctx.state.requestId}] from ${ctx.state.clientIp}`)
    return createEnvelopedResponse(ctx, result)
  } catch (err: any) {
    return createErrorResponse(ctx, err.message, ErrorCode.InternalServerError)
  }
}

export async function userLogout (ctx: Context) {
  const profile = await checkSession(ctx)
  if (profile) {
    logger.info(`User <User:${profile.uid}> logged out [${ctx.state.requestId}] from ${ctx.state.clientIp}`)
  }
  sessionService.deleteSession(ctx)
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
    const session = sessionService.getSession(ctx)
    const result = AccountProfileQueryResultSchema.encode({
      ...session, ...updatedUser.toObject(),
    })
    logger.info(`User <User:${profile.uid}> updated profile [${ctx.state.requestId}] from ${ctx.state.clientIp}`)
    return createEnvelopedResponse(ctx, result)
  } catch (err: any) {
    return createErrorResponse(ctx, err.message, ErrorCode.InternalServerError)
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
    return createErrorResponse(ctx,
      'Failed to decrypt password field', ErrorCode.BadRequest,
    )
  }

  if (!isComplexPwd(newPassword)) {
    return createErrorResponse(ctx,
      'New password is not complex enough', ErrorCode.BadRequest,
    )
  }
  const oldPwdHash = passwordHashBuffer(oldPassword)
  if (timingSafeEqual(Buffer.from(profile.pwd, 'hex'), oldPwdHash) === false) {
    return createErrorResponse(ctx,
      'Old password is incorrect', ErrorCode.Unauthorized,
    )
  }
  const pwd = passwordHash(newPassword)

  try {
    const updatedUser = await userService.updateUser(profile, { pwd })
    sessionService.setSession(ctx, updatedUser)
    logger.info(`User <User:${profile.uid}> changed password [${ctx.state.requestId}] from ${ctx.state.clientIp}`)
    return createEnvelopedResponse(ctx, null)
  } catch (err: any) {
    return createErrorResponse(ctx, err.message, ErrorCode.InternalServerError)
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

const accountController = {
  getProfile,
  userLogin,
  userRegister,
  userLogout,
  updateProfile,
  updatePassword,
  findSubmissions,
} as const

export default accountController
