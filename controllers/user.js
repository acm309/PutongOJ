const difference = require('lodash.difference')
const User = require('../models/User')
const Solution = require('../models/Solution')
const Group = require('../models/Group')
const config = require('../config')
const logger = require('../utils/logger')
const { generatePwd } = require('../utils/helper')
const { isAdmin, isRoot, isUndefined } = require('../utils/helper')

const preload = async (ctx, next) => {
  const uid = ctx.params.uid
  const user = await User.findOne({ uid }).exec()
  if (user == null) { ctx.throw(400, 'No such a user') }
  ctx.state.user = user
  return next()
}

// 查询用户组
const find = async (ctx) => {
  const filter = {}
  if (!isUndefined(ctx.query.privilege) && ctx.query.privilege === 'admin') {
    filter.privilege = {
      $in: [ config.privilege.Root, config.privilege.Teacher ],
    }
  }
  if (isAdmin(ctx.session.profile) && ctx.query.type === 'uid') {
    filter.$expr = {
      $regexMatch: {
        input: { $toString: '$uid' },
        regex: new RegExp(ctx.query.content, 'i'),
      },
    }
  }
  const list = await User
    .find(filter, { _id: 0, uid: 1, nick: 1, privilege: 1 })
    .lean()
    .exec()
  ctx.body = {
    list,
  }
}

// 查询用户具体信息
const findOne = async (ctx) => {
  const uid = ctx.params.uid
  const [ user, solved, unsolved ] = await Promise.all([
    User
      .findOne({ uid })
      .select('-timerecord -iprecord -create -_id -pwd')
      .lean()
      .exec(),
    Solution
      .find({ uid, judge: config.judge.Accepted })
      .distinct('pid')
      .lean()
      .exec(),
    Solution
      .find({ uid, judge: { $ne: config.judge.Accepted } })
      .distinct('pid')
      .lean()
      .exec(),
  ])
  const procedure = user.gid.map(gid => Group.findOne({ gid })
    .lean()
    .exec()
    .then(item => item.title))
  const group = await Promise.all(procedure)

  ctx.body = {
    user,
    solved,
    unsolved: difference(unsolved, solved),
    group,
  }
}

// 注册
const create = async (ctx) => {
  if (!ctx.request.body.pwd || ctx.request.body.pwd.length <= 5) {
    ctx.throw(400, 'the length of the password must be greater than 5')
  }
  const user = new User({
    uid: ctx.request.body.uid,
    nick: ctx.request.body.nick,
    pwd: generatePwd(ctx.request.body.pwd),
  })
  // 将objectid转换为用户创建时间(可以不用)
  // user.create = moment(objectIdToTimestamp(user._id)).format('YYYY-MM-DD HH:mm:ss')
  const doc = await User.findOne({ uid: user.uid }).exec()
  if (doc) {
    ctx.throw(400, '用户名已被占用!')
  }
  try {
    await user.save()
  } catch (err) {
    ctx.throw(400, err.message)
  }

  ctx.body = {}
}

// 修改用户信息
const update = async (ctx) => {
  if (!isAdmin(ctx.session.profile) && ctx.session.profile.uid !== ctx.state.user.uid) {
    ctx.throw(400, 'You do not have permission to change this user information!')
  }
  if (ctx.state.user.uid === 'admin' && !isRoot(ctx.session.profile)) {
    ctx.throw(400, 'You do not have permission to change Root\'s information!')
  }
  const opt = ctx.request.body
  const user = ctx.state.user
  const fields = [ 'nick', 'motto', 'school', 'mail' ]
  fields.forEach((field) => {
    if (!isUndefined(opt[field])) {
      user[field] = opt[field]
    }
  })
  if (!isUndefined(opt.privilege) && opt.privilege !== user.privilege) {
    if (!isRoot(ctx.session.profile))
      ctx.throw(400, 'You do not have permission to change the privilege!')
    user.privilege = Number.parseInt(opt.privilege)
  }
  if (opt.newPwd) {
    user.pwd = generatePwd(opt.newPwd)
  }

  try {
    await user.save()
    logger.info(`One user is updated" ${user.uid}`)
  } catch (e) {
    ctx.throw(400, e.message)
  }

  ctx.body = {
    success: true,
    uid: user.uid,
  }
}

const del = async (ctx) => {
  if (!isAdmin(ctx.session.profile) && ctx.session.profile.uid !== ctx.state.user.uid) {
    ctx.throw(400, 'You do not have permission to change this user information!')
  }
  if (ctx.state.user.uid === 'admin' && !isRoot(ctx.session.profile)) {
    ctx.throw(400, 'You do not have permission to change Root\'s information!')
  }

  const { uid } = ctx.state.user

  try {
    await User.deleteOne({ uid }).exec()
    logger.info(`One User is removed ${uid}`)
  } catch (e) {
    ctx.throw(400, e.message)
  }

  ctx.body = {}
}

module.exports = {
  preload,
  find,
  findOne,
  create,
  update,
  del,
}
