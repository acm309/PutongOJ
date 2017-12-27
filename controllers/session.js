const only = require('only')
const User = require('../models/User')
const { generatePwd } = require('../utils/helper')

const login = async (ctx) => {
  const uid = ctx.request.body.uid
  const pwd = generatePwd(ctx.request.body.pwd)

  const user = await User
    .findOne({ uid })
    .exec()

  if (user == null) {
    ctx.throw(400, 'No such a user')
  }
  if (user.pwd !== pwd) {
    ctx.throw(400, 'Wrong password')
  }

  ctx.session.profile = only(user, 'uid nick')
  ctx.body = {}
}

const logout = async (ctx) => {
  delete ctx.session.profile
  ctx.body = {}
}

const profile = async (ctx) => {
  ctx.body = {
    profile: ctx.session.profile
  }
}

module.exports = {
  login,
  logout,
  profile
}
