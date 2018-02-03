const only = require('only')
const pull = require('lodash.pull')
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
  const list = await Group.find({}).exec()

  ctx.body = {
    list
  }
}

// 返回一个group
const findOne = async (ctx) => {
  const group = ctx.state.group

  ctx.body = {
    group
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
        return user.save()
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
  const list = group.list
  const gid = group.gid

  // 删除user表里的原user的gid
  const delProcedure = list.map((uid, index) => {
    return User.findOne({ uid }).exec()
      .then((user) => {
        pull(user.gid, gid)
        return user.save()
      })
      .then((user) => {
        logger.info(`User's old group is deleted" ${user.uid} -- ${gid}`)
      })
      .catch((e) => {
        ctx.throw(400, e.message)
      })
  })
  await Promise.all(delProcedure)

  fileds.forEach((filed) => {
    group[filed] = opt[filed]
  })

  // 新增user表里user的gid
  const addProcedure = opt.list.map((uid, index) => {
    return User.findOne({ uid }).exec()
      .then((user) => {
        user.gid.push(gid)
        return user.save()
      })
      .then((user) => {
        logger.info(`User's new group is updated" ${user.uid} -- ${gid}`)
      })
      .catch((e) => {
        ctx.throw(400, e.message)
      })
  })
  await Promise.all(addProcedure)

  try {
    await group.save()
    logger.info(`One group is updated" ${group.gid} -- ${group.title}`)
  } catch (e) {
    ctx.throw(400, e.message)
  }

  ctx.body = {
    gid: group.gid
  }
}

// 删除一个group
const del = async (ctx) => {
  const gid = parseInt(ctx.params.gid)
  const group = ctx.state.group
  const list = group.list

  // 删除user表里的gid
  const procedure = list.map((uid, index) => {
    return User.findOne({uid}).exec()
      .then((user) => {
        pull(user.gid, gid)
        return user.save()
      })
      .then((user) => {
        logger.info(`User's group is deleted" ${user.uid} -- ${gid}`)
      })
      .catch((e) => {
        ctx.throw(400, e.message)
      })
  })
  await Promise.all(procedure)

  // 清空所有用户的gid
  // const users = await User.find({})
  // users.forEach((user) => {
  //   user.gid.splice(0, user.gid.length)
  //   console.log(user.gid)
  // })
  // await Promise.all(users.map(s => s.save()))

  // 删除group表里的gid
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
