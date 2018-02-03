const pull = require('lodash.pull')
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

// 更新一个tag
const update = async (ctx) => {
  const opt = ctx.request.body
  const tag = ctx.state.tag
  const newList = opt.list
  const oldList = tag.list
  const tid = tag.tid

  // 删除tag表里的原problem表的tid
  const delProcedure = oldList.map((pid, index) => {
    return Problem.findOne({ pid }).exec()
      .then((problem) => {
        pull(problem.tags, tid)
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

  tag.list = newList

  // 新增tag表里user的tid
  const addProcedure = newList.map((pid, index) => {
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

module.exports = {
  preload,
  find,
  findOne,
  update
}
