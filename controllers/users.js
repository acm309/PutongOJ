const User = require('../models/User')
const Solution = require('../models/Solution')
const _ = require('ramda')
const { generatePwd, isUndefined } = require('../utils')
const only = require('only')

/** 验证 uid 对应的用户是否存在 是否合法 */
async function validateUid (uid, ctx, next) {
  const user = await User.findOne({ uid }).exec()
  if (!user) {
    ctx.throw(400, 'No such a user')
  }
  ctx.user = user
  return next()
}

async function queryUsers (ctx, next) {
  const filters = {}
  // 可用于筛选的条件，目前仅有此项
  for (let item of ['privilege']) {
    if (!isUndefined(ctx.query[item])) {
      filters[item] = ctx.query[item]
    }
  }
  const users = await User
    .find(filters)
    .select('-_id uid nick privilege')
    .exec()
  ctx.body = { users }
}

/**
  指定 uid，返回一个以存在的用户
*/
async function queryOneUser (ctx, next) {
  const uid = ctx.params.uid
  const user = ctx.user

  let solved = await Solution
    .find({uid, judge: ctx.config.judge.Accepted})
    .distinct('pid')
    .exec()

  solved = _.sort((x, y) => (x < y ? -1 : 1), solved)

  let unsolved = await Solution
    .find({uid, judge: {$ne: ctx.config.judge.Accepted}})
    .distinct('pid')
    .exec()

  unsolved = _.filter((pid) => !solved.includes(pid), unsolved)

  ctx.body = {
    user: only(user, 'uid nick solve submit status timerecord iprecord school mail motto privilege'),
    solved,
    unsolved
  }
}

/**
  注册用户
*/
async function register (ctx, next) {
  ;['uid', 'nick', 'pwd'].forEach((item) => {
    if (!ctx.request.body[item]) {
      ctx.throw(400, `Field "${item}" is needed!`)
    }
  })

  const verified = User.validate(ctx.request.body)

  if (!verified.valid) {
    ctx.throw(400, verified.error)
  }

  const { uid, nick, pwd } = ctx.request.body

  // 避免重复注册; uid 不可重，其它可重
  const uidExist = await User
    .count({uid})
    .exec()

  if (uidExist) {
    ctx.throw(400, `Oh no, username "${uid}" has been used by others.`)
  }

  const user = new User({
    uid,
    nick,
    pwd: generatePwd(pwd)
  })

  user.updateRecords(ctx.ip, Date.now())

  await user.save()

  ctx.body = {
    user: only(user, 'uid nick privilege')
  }
}

/**
  更新一个已存在用户
*/
async function update (ctx, next) {
  const user = ctx.user
  const uid = user.uid

  if (!user) {
    ctx.throw(400, 'No such a user')
  }

  // 你不能修改他人的信息，除非你权限很高（比如 admin）
  if (ctx.session.user.uid !== uid &&
    ctx.session.user.privilege !== ctx.config.privilege.Admin) {
    ctx.throw(400, "You are not allowed to update others' info")
  }

  const verified = User.validate(ctx.request.body)

  if (!verified.valid) {
    ctx.throw(400, verified.error)
  }

  if (!isUndefined(ctx.request.body['pwd'])) {
    ctx.request.body.pwd = generatePwd(ctx.request.body.pwd)
  }
  // 可更新的字段
  const fields = ['nick', 'pwd', 'school', 'mail', 'motto', 'privilege']

  fields.forEach((item) => {
    if (!isUndefined(ctx.request.body[item])) {
      user[item] = ctx.request.body[item]
    }
  })

  await user.save()

  ctx.body = {
    user: only(user, 'uid nick privilege school mail motto')
  }
}

module.exports = {
  queryOneUser,
  register,
  update,
  queryUsers,
  validateUid
}
