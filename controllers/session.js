const only = require('only')
const { privilege } = require('../config')
const User = require('../models/User')
const { generatePwd } = require('../utils/helper')

// 登录
const login = async (ctx) => {
  const uid = ctx.request.body.uid
  const pwd = generatePwd(ctx.request.body.pwd)

  const user = await User
    .findOne({ uid })
    .exec()

  if (user == null) { ctx.throw(400, 'No such a user') }
  if (user.pwd !== pwd) { ctx.throw(400, 'Wrong password') }
  if (user.privilege === privilege.Banned) { ctx.throw(403, 'Account banned') }

  ctx.session.profile = only(user, '_id uid nick privilege pwd')
  ctx.session.profile.verifyContest = []
  ctx.body = {
    profile: ctx.session.profile,
  }
}

// 登出
const logout = async (ctx) => {
  delete ctx.session.profile
  ctx.body = {}
}

// 检查登录状态
const profile = async (ctx) => {
  const profile = ctx.session.profile ? ctx.session.profile : null
  ctx.body = {
    profile,
  }
}

module.exports = {
  login,
  logout,
  profile,
}
