import type { Context } from 'koa'
import User from '../models/User'
import cryptoService from '../services/crypto'
import sessionService from '../services/session'
import { createEnvelopedResponse, createErrorResponse, passwordHash } from '../utils'
import { privilege } from '../utils/constants'
import logger from '../utils/logger'

export async function userLogin (ctx: Context) {
  const requestId = ctx.state.requestId || 'unknown'
  const opt = ctx.request.body

  if (typeof opt.uid !== 'string' || opt.uid.trim() === '') {
    return createErrorResponse(ctx, 'Username is required')
  }
  const uid = opt.uid.trim()

  if (typeof opt.pwd !== 'string' || opt.pwd.trim() === '') {
    return createErrorResponse(ctx, 'Password is required')
  }
  let pwd: string | null = null
  try {
    pwd = await cryptoService.decryptData(opt.pwd.trim())
  } catch (e: any) {
    logger.info(`Bad password encryption: ${e.message} [${requestId}]`)
    return createErrorResponse(ctx, 'Bad password encryption')
  }
  const pwdHash = passwordHash(pwd)

  const user = await User
    .findOne({ uid })
    .exec()

  if (!user || user.pwd !== pwdHash) {
    return createErrorResponse(ctx,
      'Username or password is incorrect',
    )
  }
  if (user.privilege === privilege.Banned) {
    return createErrorResponse(ctx,
      'Account has been banned, please contact the administrator',
    )
  }

  logger.info(`User <${uid}> login successfully [${requestId}]`)
  const profile = sessionService.setSession(ctx, user)
  return createEnvelopedResponse(ctx, profile)
}

// 登出
const logout = async (ctx: Context) => {
  const { requestId = 'unknown' } = ctx.state
  if (ctx.session.profile) {
    const uid = ctx.session.profile.uid
    logger.info(`User <${uid}> logout successfully [${requestId}]`)
  }
  sessionService.deleteSession(ctx)
  ctx.body = {}
}

// 检查登录状态
const profile = async (ctx: Context) => {
  const { profile = null } = ctx.session
  const { requestId = 'unknown' } = ctx.state

  if (profile) {
    logger.info(`User <${profile.uid}> check login status [${requestId}]`)
  }
  ctx.body = {
    profile,
  }
}

const sessionController = {
  userLogin,
  logout,
  profile,
} as const

export default sessionController
