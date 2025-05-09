const only = require('only')
const Discuss = require('../models/Discuss')
const { isLogined, isAdmin } = require('../utils/helper')
const logger = require('../utils/logger')

/**
 * 讨论预加载中间件
 */
const preload = async (ctx, next) => {
  const did = Number(ctx.params.did)
  if (!Number.isInteger(did) || did <= 0) {
    return ctx.throw(400, 'Invalid discuss ID')
  }
  const discuss = await Discuss.findOne({ did }).exec()
  if (!discuss) {
    return ctx.throw(404, 'Discuss not found')
  }

  const { profile } = ctx.state
  if (discuss.uid !== profile.uid && !isAdmin(profile)) {
    return ctx.throw(403, 'Permission denied')
  }

  ctx.state.discuss = discuss
  return next()
}

/**
 * 讨论列表
 */
const find = async (ctx) => {
  if (!isLogined(ctx)) {
    ctx.body = { list: [] }
    return
  }

  const { profile } = ctx.state
  const query = isAdmin(profile) ? {} : { uid: profile.uid }
  const list = await Discuss
    .find(query, { did: 1, title: 1, update: 1, uid: 1, _id: 0 })
    .sort({ update: -1 })
    .lean()
    .exec()

  ctx.body = { list }
}

/**
 * 获取单个讨论
 */
const findOne = async (ctx) => {
  const { discuss } = ctx.state
  ctx.body = { discuss: only(discuss, 'did title uid comments') }
}

/**
 * 创建讨论
 */
const create = async (ctx) => {
  const { title, content } = ctx.request.body
  const { profile: { uid } } = ctx.state
  const discuss = new Discuss({
    title, uid, comments: [ { uid, content } ],
  })

  try {
    await discuss.save()
    logger.info(`New Discuss is created" ${discuss.did} -- ${discuss.title}`)
  } catch (e) {
    ctx.throw(400, e.message)
  }

  ctx.body = only(discuss, 'did')
}

/**
 * 新增评论
 */
const update = async (ctx) => {
  const { content } = ctx.request.body
  const { discuss, profile: { uid } } = ctx.state

  try {
    discuss.comments.push({ uid, content })
    discuss.update = Date.now()
    await discuss.save()
    // redis.lpush('oj:comment', discuss.did)
    logger.info(`One discuss is updated" ${discuss.did} -- ${discuss.title}`)
  } catch (e) {
    ctx.throw(400, e.message)
  }

  ctx.body = only(discuss, 'did')
}

const del = async (ctx) => {
  const did = ctx.params.did

  try {
    await Discuss.deleteOne({ did }).exec()
    logger.info(`One Discuss is delete ${did}`)
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
