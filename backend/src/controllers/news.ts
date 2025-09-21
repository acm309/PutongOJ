import type { Context } from 'node:vm'
import config from '../config'
import News from '../models/News'
import { only } from '../utils'
import logger from '../utils/logger'

/**
 * 预加载通知信息
 */
const preload = async (ctx: Context, next: () => Promise<any>) => {
  const nid = Number.parseInt(ctx.params.nid)
  if (Number.isNaN(nid)) {
    ctx.throw(400, 'Nid has to be a number')
  }
  const news = await News.findOne({ nid }).exec()
  if (!news) {
    ctx.throw(400, 'No such a news')
  }
  ctx.state.news = news
  return next()
}

/**
 * 查询通知列表
 */
const find = async (ctx: Context) => {
  const opt = ctx.request.query
  const page = Number.parseInt(opt.page) || 1
  const pageSize = Number.parseInt(opt.pageSize) || 5

  const filter: Record<string, any> = {}
  if (!ctx.session.profile?.isAdmin) {
    filter.status = config.status.Available
  }

  const list = await News.paginate(filter, {
    sort: { nid: -1 },
    page,
    limit: pageSize,
    lean: true,
    leanWithId: false,
    select: '-_id nid title status create',
  })
  ctx.body = { list }
}

/**
 * 查询一条通知
 */
const findOne = async (ctx: Context) => {
  const news = ctx.state.news
  ctx.body = { news: only(news, 'nid title content status create') }
}

// 新建一条消息
const create = async (ctx: Context) => {
  const opt = ctx.request.body
  const { profile: { uid } } = ctx.state
  const news = new News(Object.assign(
    only(opt, 'title content'),
    { // nid 会自动生成
      create: Date.now(),
    },
  ))

  try {
    await news.save()
    logger.info(`News <${news.nid}> is created by <${uid}>`)
  } catch (e: any) {
    ctx.throw(400, e.message)
  }

  ctx.body = {
    nid: news.nid,
  }
}

// 更新一条消息
const update = async (ctx: Context) => {
  const opt = ctx.request.body
  const news = ctx.state.news
  const { profile: { uid } } = ctx.state
  const fields = [ 'title', 'content', 'status' ]
  fields.forEach((field) => {
    news[field] = opt[field]
  })
  try {
    await news.save()
    logger.info(`News <${news.nid}> is updated by <${uid}>`)
  } catch (e: any) {
    ctx.throw(400, e.message)
  }

  ctx.body = {
    nid: news.nid,
  }
}

// 删除一条消息
const del = async (ctx: Context) => {
  const nid = ctx.params.nid
  const { profile: { uid } } = ctx.state

  try {
    await News.deleteOne({ nid }).exec()
    logger.info(`News <${nid}> is deleted by <${uid}>`)
  } catch (e: any) {
    ctx.throw(400, e.message)
  }

  ctx.body = {}
}

const newsController = {
  preload,
  find,
  findOne,
  create,
  update,
  del,
} as const

export default newsController
