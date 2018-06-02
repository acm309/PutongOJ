const only = require('only')
const without = require('lodash.without')
const difference = require('lodash.difference')
const Tag = require('../models/Tag')
const Problem = require('../models/Problem')
const logger = require('../utils/logger')

const preload = async (ctx, next) => {
  const tid = ctx.params.tid
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
const create = async (ctx) => {
  const opt = ctx.request.body

  const doc = await Tag.findOne({ tid: opt.tid }).exec()
  if (doc) {
    ctx.throw(400, '标签名已被占用!')
  }

  const tag = new Tag(Object.assign(
    only(opt, 'tid list'), {
      create: Date.now()
    }
  ))

  try {
    await tag.save()

    logger.info(`New tag is created" ${tag.tid}`)
  } catch (e) {
    ctx.throw(400, e.message)
  }

  const procedure = opt.list.map((pid, index) => {
    return Problem.findOne({ pid }).exec()
      .then((problem) => {
        problem.tags.push(tag.tid)
        return problem.save()
      })
      .then((problem) => {
        logger.info(`Problem is updated" ${problem.uid} -- ${problem.tags}`)
      })
      .catch((e) => {
        ctx.throw(400, e.message)
      })
  })
  await Promise.all(procedure)

  ctx.body = {
    tid: tag.tid
  }
}

// 更新一个 tag
const update = async (ctx) => {
  const opt = ctx.request.body
  const tag = ctx.state.tag
  const newList = opt.list
  const oldList = tag.list
  const tid = tag.tid

  // 这些 pid 被移除了 tid
  const pidsOfRemovedTids = difference(oldList, newList)

  // 这些 pid 被新增了 tid
  const pidsOfImportedTids = difference(newList, oldList)

  // 删除 tag 表里的原 problem 表的 tid
  const delProcedure = pidsOfRemovedTids.map((pid, index) => {
    return Problem.findOne({ pid }).exec()
      .then((problem) => {
        problem.tags = without(problem.tags, tid)
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

  // 新增 tag 表里 user 的 tid
  const addProcedure = pidsOfImportedTids.map((pid, index) => {
    return Problem.findOne({ pid }).exec()
      .then((problem) => {
        problem.tags.push(tid)
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

  tag.list = newList

  try {
    await tag.save()
    logger.info(`One tag is updated" ${tag.tid}`)
  } catch (e) {
    ctx.throw(400, e.message)
  }

  ctx.body = {
    tid: tag.tid
  }
}

// 删除一个 tag
const del = async (ctx) => {
  const tid = ctx.params.tid
  const tag = ctx.state.tag
  const list = tag.list

  // 删除 problem 表里的 tid
  const procedure = list.map((pid, index) => {
    return Problem.findOne({pid}).exec()
      .then((problem) => {
        problem.tag = without(problem.tags, tid)
        return problem.save()
      })
      .then((problem) => {
        logger.info(`Problem's tag is deleted" ${problem.pid} -- ${tid}`)
      })
      .catch((e) => {
        ctx.throw(400, e.message)
      })
  })
  await Promise.all(procedure)

  // 删除 tag 表里的 tid
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
  create,
  find,
  findOne,
  update,
  del
}
