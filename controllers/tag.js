// const only = require('only')
const Tag = require('../models/Tag')
const Problem = require('../models/Problem')
const logger = require('../utils/logger')

const preload = async (ctx, next) => {
  console.log(ctx.request.body)
  const tid = parseInt(ctx.params.tid)
  console.log(tid)
  if (isNaN(tid)) ctx.throw(400, 'Tid has to be a number')
  const tag = await Tag.findOne({ tid }).exec()
  if (tag == null) ctx.throw(400, 'No such a tag')
  ctx.state.tag = tag
  return next()
}

// 返回tag列表
const find = async (ctx) => {
  const list = await Tag.find({}).exec()

  ctx.body = {
    list
  }
}

// 返回一个tag
const findOne = async (ctx) => {
  const tag = ctx.state.tag

  ctx.body = {
    tag
  }
}

// 新建一个tag
// const create = async (ctx) => {
//   const opt = ctx.request.body

//   const group = new Group(Object.assign(
//     only(opt, 'title list'),
//     { // gid 会自动生成
//       create: Date.now()
//     }
//   ))

//   try {
//     await group.save()
//     logger.info(`New group is created" ${group.gid} -- ${group.title}`)
//   } catch (e) {
//     ctx.throw(400, e.message)
//   }

//   const procedure = opt.list.map((uid, index) => {
//     return User.findOne({ uid }).exec()
//       .then((user) => {
//         user.gid.push(group.gid)
//         return user.save()
//       })
//       .then((user) => {
//         logger.info(`User is updated" ${user.uid} -- ${user.gid}`)
//       })
//       .catch((e) => {
//         ctx.throw(400, e.message)
//       })
//   })
//   await Promise.all(procedure)

//   ctx.body = {
//     gid: group.gid
//   }
// }

// 更新一个tag
const update = async (ctx) => {
  const opt = ctx.request.body
  const tag = ctx.state.tag
  const fileds = ['title', 'list']
  const list = tag.list
  const tid = tag.tid

  console.log(tag)
  // 删除tag表里的原problem表的tid
  const delProcedure = list.map((pid, index) => {
    return Problem.findOne({ pid }).exec()
      .then((problem) => {
        const ind = problem.tag.indexOf(tag.title)
        if (ind !== -1) {
          problem.tag.splice(ind, 1)
        }
        return problem.save()
      })
      .then((problem) => {
        logger.info(`Problem's old tag is deleted" ${problem.pid} -- ${tid}`)
      })
      .catch((e) => {
        ctx.throw(400, e.message)
      })
  })
  await Promise.all(delProcedure)

  fileds.forEach((filed) => {
    tag[filed] = opt[filed]
  })

  // 新增user表里user的tid
  const addProcedure = opt.list.map((pid, index) => {
    return Problem.findOne({ pid }).exec()
      .then((problem) => {
        console.log(problem)
        problem.tag.push(tag.title)
        return problem.save()
      })
      .then((problem) => {
        logger.info(`Problem's new tag is updated" ${problem.pid} -- ${tid}`)
      })
      .catch((e) => {
        ctx.throw(400, e.message)
      })
  })
  await Promise.all(addProcedure)

  try {
    await tag.save()
    logger.info(`One tag is updated" ${tag.tid} -- ${tag.title}`)
  } catch (e) {
    ctx.throw(400, e.message)
  }

  ctx.body = {
    tid: tag.tid
  }
}

// 删除一个tag
const del = async (ctx) => {
  const tid = parseInt(ctx.params.tid)
  const tag = ctx.state.tag
  const list = tag.list

  // 删除user表里的gid
  const procedure = list.map((uid, index) => {
    return User.findOne({ uid }).exec()
      .then((user) => {
        const ind = user.gid.indexOf(tid)
        if (ind !== -1) {
          user.tid.splice(ind, 1)
        }
        return user.save()
      })
      .then((user) => {
        logger.info(`User's tag is deleted" ${user.uid} -- ${tid}`)
      })
      .catch((e) => {
        ctx.throw(400, e.message)
      })
  })
  await Promise.all(procedure)

  // 删除tag表里的tid
  try {
    await Tag.deleteOne({ tid }).exec()
    logger.info(`One Tag is delete ${tid}`)
  } catch (e) {
    ctx.throw(400, e.message)
  }

  ctx.body = {}
}

module.exports = {
  preload,
  find,
  findOne,
  // create,
  update,
  del
}
