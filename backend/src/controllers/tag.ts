import type { Context } from 'koa'
import type { TagDocument } from '../models/Tag'
import { pick } from 'lodash'
import difference from 'lodash/difference'
import without from 'lodash/without'
import { loadProfile } from '../middlewares/authn'
import Problem from '../models/Problem'
import Tag from '../models/Tag'
import { ERR_INVALID_ID, ERR_NOT_FOUND } from '../utils/error'
import logger from '../utils/logger'

const loadTag = async (
  ctx: Context,
  inputId?: string,
): Promise<TagDocument> => {
  const tagId = String(
    inputId || ctx.params.tid || ctx.request.query.tid,
  )
  if (!tagId) {
    return ctx.throw(...ERR_INVALID_ID)
  }
  if (ctx.state.tag?.tid === tagId) {
    return ctx.state.tag
  }

  const tag = await Tag.findOne({ tid: tagId })
  if (!tag) {
    return ctx.throw(...ERR_NOT_FOUND)
  }

  ctx.state.tag = tag
  return tag
}

const findTags = async (ctx: Context) => {
  const list = await Tag.find({}, { tid: 1 }).exec()

  ctx.body = {
    list,
  }
}

const getTag = async (ctx: Context) => {
  const tag = await loadTag(ctx)

  ctx.body = {
    tag,
  }
}

const createTag = async (ctx: Context) => {
  const opt = ctx.request.body
  const { uid } = await loadProfile(ctx)

  const doc = await Tag.findOne({ tid: opt.tid }).exec()
  if (doc) {
    ctx.throw(400, '标签名已被占用!')
  }

  const tag = new Tag(Object.assign(
    pick(opt, [ 'tid', 'list' ]), {
      create: Date.now(),
    },
  ))

  try {
    await tag.save()
    logger.info(`Tag <${tag.tid}> is created by user <${uid}>`)
  } catch (e: any) {
    ctx.throw(400, e.message)
  }

  const procedure = opt.list.map(async (pid: number) => {
    const problem = await Problem.findOne({ pid })
    if (!problem) {
      ctx.throw(...ERR_INVALID_ID)
    }
    problem.tags.push(tag.tid)
    problem.save()
    logger.info(`Problem <${problem.pid}> is added to tag <${tag.tid}>`)
  })
  await Promise.all(procedure)

  ctx.body = {
    tid: tag.tid,
  }
}

const updateTag = async (ctx: Context) => {
  const opt = ctx.request.body
  const tag = await loadTag(ctx)
  const newList = opt.list as number[]
  const oldList = tag.list as number[]
  const tid = tag.tid

  // 这些 pid 被移除了 tid
  const pidsOfRemovedTids = difference(oldList, newList)

  // 这些 pid 被新增了 tid
  const pidsOfImportedTids = difference(newList, oldList)

  // 删除 tag 表里的原 problem 表的 tid
  const delProcedure = pidsOfRemovedTids.map(async (pid: number) => {
    const problem = await Problem.findOne({ pid })
    if (!problem) {
      return
    }
    problem.tags = without(problem.tags, tid)
    problem.save()
    logger.info(`Problem <${problem.pid}> is deleted from tag <${tag.tid}>`)
  })
  await Promise.all(delProcedure)

  // 新增 tag 表里 user 的 tid
  const addProcedure = pidsOfImportedTids.map(async (pid: number) => {
    const problem = await Problem.findOne({ pid }).exec()
    if (!problem) {
      ctx.throw(...ERR_INVALID_ID)
    }
    problem.tags.push(tid)
    problem.save()
    logger.info(`Problem <${problem.pid}> is added to tag <${tag.tid}>`)
  })
  await Promise.all(addProcedure)

  tag.list = newList

  try {
    await tag.save()
    logger.info(`Tag <${tag.tid}> is updated`)
  } catch (e: any) {
    ctx.throw(400, e.message)
  }

  ctx.body = {
    tid: tag.tid,
  }
}

const removeTag = async (ctx: Context) => {
  const tid = ctx.params.tid
  const tag = await loadTag(ctx)
  const list = tag.list
  const { uid } = await loadProfile(ctx)

  // 删除 problem 表里的 tid
  const procedure = list.map(async (pid: number) => {
    const problem = await Problem.findOne({ pid })
    if (!problem) {
      return
    }
    problem.tags = without(problem.tags, tid)
    problem.save()
    logger.info(`Problem <${problem.pid}> is deleted from tag <${tag.tid}>`)
  })
  await Promise.all(procedure)

  // 删除 tag 表里的 tid
  try {
    await Tag.deleteOne({ tid }).exec()
    logger.info(`Tag <${tid}> is deleted by user <${uid}>`)
  } catch (e: any) {
    ctx.throw(400, e.message)
  }

  ctx.body = {}
}

const tagController = {
  loadTag,
  createTag,
  findTags,
  getTag,
  updateTag,
  removeTag,
}

export default module.exports = tagController
