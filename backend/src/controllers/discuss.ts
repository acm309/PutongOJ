import type { Context } from 'koa'
import { loadProfile } from '../middlewares/authn'
import Discuss from '../models/Discuss'
import { only } from '../utils'
import logger from '../utils/logger'

/**
 * 讨论预加载中间件
 */
const preload = async (ctx: Context, next: () => Promise<any>) => {
  const did = Number(ctx.params.did)
  if (!Number.isInteger(did) || did <= 0) {
    return ctx.throw(400, 'Invalid discuss ID')
  }
  const discuss = await Discuss.findOne({ did }).exec()
  if (!discuss) {
    return ctx.throw(404, 'Discuss not found')
  }

  const profile = await loadProfile(ctx)
  if (discuss.uid !== profile.uid && !profile.isAdmin) {
    return ctx.throw(403, 'Permission denied')
  }

  ctx.state.discuss = discuss
  return next()
}

/**
 * 讨论列表
 */
const find = async (ctx: Context) => {
  if (!ctx.session.profile) {
    ctx.body = { list: [] }
    return
  }

  const profile = await loadProfile(ctx)
  const query = profile.isAdmin ? {} : { uid: profile.uid }
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
const findOne = async (ctx: Context) => {
  const { discuss } = ctx.state
  ctx.body = { discuss: only(discuss, 'did title uid comments') }
}

/**
 * 创建讨论
 */
const create = async (ctx: Context) => {
  const { title, content } = ctx.request.body
  const { uid } = await loadProfile(ctx)
  const discuss = new Discuss({
    title, uid, comments: [ { uid, content } ],
  })

  try {
    await discuss.save()
    logger.info(`Discuss <${discuss.did}> is created by <${uid}>`)
  } catch (e: any) {
    ctx.throw(400, e.message)
  }

  ctx.body = only(discuss, 'did')
}

/**
 * 新增评论
 */
const update = async (ctx: Context) => {
  const { content } = ctx.request.body
  const { discuss } = ctx.state
  const { uid } = await loadProfile(ctx)

  try {
    discuss.comments.push({ uid, content })
    discuss.update = Date.now()
    await discuss.save()
    // redis.lpush('oj:comment', discuss.did)
    logger.info(`Discuss <${discuss.did}> is updated by <${uid}>`)
  } catch (e: any) {
    ctx.throw(400, e.message)
  }

  ctx.body = only(discuss, 'did')
}

const del = async (ctx: Context) => {
  const did = ctx.params.did
  const { uid } = await loadProfile(ctx)

  try {
    await Discuss.deleteOne({ did }).exec()
    logger.info(`Discuss <${did}> is deleted by <${uid}>`)
  } catch (e: any) {
    ctx.throw(400, e.message)
  }

  ctx.body = {}
}

const discussController = {
  preload,
  find,
  findOne,
  create,
  update,
  del,
} as const

export default discussController
