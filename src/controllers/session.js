const only = require('only')
const { privilege } = require('../config')
const User = require('../models/User')
const { generatePwd } = require('../utils/helper')
const logger = require('../utils/logger')

// 登录
const login = async (ctx) => {
  const uid = ctx.request.body.uid
  const pwd = generatePwd(ctx.request.body.pwd)
  const { requestId = 'unknown' } = ctx.state

  const user = await User
    .findOne({ uid })
    .exec()

  if (user == null) { ctx.throw(400, `No such a user <${uid}>`) }
  if (user.pwd !== pwd) { ctx.throw(400, `Wrong password for user <${uid}>`) }
  if (user.privilege === privilege.Banned) { ctx.throw(403, `User <${uid}> is banned`) }

  logger.info(`User <${uid}> login successfully [${requestId}]`)
  ctx.session.profile = only(user, '_id uid nick privilege pwd')
  ctx.session.profile.verifyContest = []
  ctx.body = {
    profile: ctx.session.profile,
  }
}

// 登出
const logout = async (ctx) => {
  const { requestId = 'unknown' } = ctx.state
  if (ctx.session.profile) {
    const uid = ctx.session.profile.uid
    logger.info(`User <${uid}> logout successfully [${requestId}]`)
  }
  delete ctx.session.profile
  ctx.body = {}
}

// 检查登录状态
const profile = async (ctx) => {
  const { profile = null } = ctx.session
  const { requestId = 'unknown' } = ctx.state

  if (profile) {
    logger.info(`User <${profile.uid}> check login status [${requestId}]`)
  }
  ctx.body = {
    profile,
  }
}

module.exports = {
  login,
  logout,
  profile,
}
