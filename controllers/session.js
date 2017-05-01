const User = require('../models/User')
const { generatePwd } = require('../utils')

/**
  登录
*/
async function login (ctx, next) {
  if (ctx.session.user) {
    ctx.throw(400, 'You have logined')
  }

  const { uid, pwd } = ctx.request.body
  const user = await User
    .findOne({uid})
    .exec()
  if (!user) {
    ctx.throw(400, 'No such a user')
  }
  if (user.pwd !== generatePwd(pwd)) {
    ctx.throw(400, 'Wrong password')
  }

  ctx.session.user =
  ctx.body = {
    uid,
    nick: user.nick,
    privilege: user.privilege
  }
}

/**
  登出
*/
async function logout (ctx, next) {
  if (ctx.session.user) {
    ctx.session = null
  }
  ctx.body = {}
}

/**
  检查当前登录状态
*/
async function fetchSession (ctx, next) {
  if (ctx.session.user) {
    ctx.body = {
      uid: ctx.session.user.uid,
      nick: ctx.session.user.nick,
      privilege: ctx.session.user.privilege
    }
  } else {
    ctx.body = {}
  }
}

module.exports = {
  login,
  logout,
  fetchSession
}
