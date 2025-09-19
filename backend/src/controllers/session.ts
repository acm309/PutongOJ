import type { Context } from 'koa'
import User from '../models/User'
import cryptoService from '../services/crypto'
import sessionService from '../services/session'
import { generatePwd } from '../utils'
import { privilege } from '../utils/constants'
import logger from '../utils/logger'

// 登录
const login = async (ctx: Context) => {
  const opt = ctx.request.body
  const { requestId = 'unknown' } = ctx.state

  if (typeof opt.uid !== 'string' || opt.uid.trim() === '') {
    ctx.throw(400, 'Username is required')
  }
  const uid = opt.uid.trim()

  if (typeof opt.pwd !== 'string' || opt.pwd.trim() === '') {
    ctx.throw(400, 'Password is required')
  }
  let pwd: string | null = null
  try {
    pwd = await cryptoService.decryptData(opt.pwd.trim())
  } catch (e: any) {
    logger.info(`Bad password encryption: ${e.message} [${requestId}]`)
    ctx.throw(400, 'Bad password encryption')
  }
  const pwdHash = generatePwd(pwd)

  const user = await User
    .findOne({ uid })
    .exec()

  if (user == null) { ctx.throw(400, `No such a user <${uid}>`) }
  if (user.pwd !== pwdHash) { ctx.throw(400, `Wrong password for user <${uid}>`) }
  if (user.privilege === privilege.Banned) { ctx.throw(403, `User <${uid}> is banned`) }

  logger.info(`User <${uid}> login successfully [${requestId}]`)
  const profile = sessionService.setUserSession(ctx, user)
  ctx.body = { profile }
}

// 登出
const logout = async (ctx: Context) => {
  const { requestId = 'unknown' } = ctx.state
  if (ctx.session.profile) {
    const uid = ctx.session.profile.uid
    logger.info(`User <${uid}> logout successfully [${requestId}]`)
  }
  sessionService.deleteUserSession(ctx)
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
  login,
  logout,
  profile,
}

export default sessionController
