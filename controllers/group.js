const only = require('only')
const Group = require('../models/Group')
const User = require('../models/User')
const logger = require('../utils/logger')

const preload = async (ctx, next) => {
  const gid = parseInt(ctx.params.gid)
  if (isNaN(gid)) ctx.throw(400, 'Gid has to be a number')
  const group = await Group.findOne({ gid }).exec()
  if (group == null) ctx.throw(400, 'No such a group')
  ctx.state.group = group
  return next()
}

// 返回group列表
const find = async (ctx) => {
  const res = await Group.find({}).exec()

  ctx.body = {
    res
  }
}

// 返回一个group
const findOne = async (ctx) => {
  const group = ctx.state.group

  ctx.body = {
    res: group
  }
}

// 新建一个group
const create = async (ctx) => {
  const opt = ctx.request.body

  const group = new Group(Object.assign(
    only(opt, 'title list'),
    { // gid 会自动生成
      create: Date.now()
    }
  ))

  try {
    await group.save()
    logger.info(`New group is created" ${group.gid} -- ${group.title}`)
  } catch (e) {
    ctx.throw(400, e.message)
  }

  const procedure = opt.list.map((uid, index) => {
    return User.findOne({uid}).exec()
      .then((user) => {
        user.gid.push(group.gid)
        return user
      })
      .then((user) => {
        user.save()
        return user
      })
      .then((user) => {
        logger.info(`User is updated" ${user.uid} -- ${user.gid}`)
      })
      .catch((e) => {
        ctx.throw(400, e.message)
      })
  })
  await Promise.all(procedure)

  ctx.body = {
    gid: group.gid
  }
}

// 更新一个group
const update = async (ctx) => {
  const opt = ctx.request.body
  const group = ctx.state.group
  const fileds = ['title', 'list']
  fileds.forEach((filed) => {
    group[filed] = opt[filed]
  })
  try {
    await group.save()
    logger.info(`One group is updated" ${group.gid} -- ${group.title}`)
  } catch (e) {
    ctx.throw(400, e.message)
  }

  ctx.body = {
    success: true,
    gid: group.gid
  }
}

// 删除一道题目
const del = async (ctx) => {
  const gid = ctx.params.gid

  try {
    await Group.deleteOne({ gid }).exec()
    logger.info(`One Group is delete ${gid}`)
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
  del
}
