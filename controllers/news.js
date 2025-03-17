const only = require('only')
const config = require('../config')
const News = require('../models/News')
const { isAdmin } = require('../utils/helper')
const logger = require('../utils/logger')

/**
 * 预加载通知信息
 */
const preload = async (ctx, next) => {
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
const find = async (ctx) => {
  const opt = ctx.request.query
  const page = Number.parseInt(opt.page) || 1
  const pageSize = Number.parseInt(opt.pageSize) || 5

  const filter = {}
  if (!isAdmin(ctx.session.profile)) {
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
const findOne = async (ctx) => {
  const news = ctx.state.news
  ctx.body = { news: only(news, 'nid title content status create') }
}

// 新建一条消息
const create = async (ctx) => {
  const opt = ctx.request.body
  const news = new News(Object.assign(
    only(opt, 'title content'),
    { // nid 会自动生成
      create: Date.now(),
    },
  ))

  try {
    await news.save()
    logger.info(`New news is created" ${news.pid} -- ${news.title}`)
  } catch (e) {
    ctx.throw(400, e.message)
  }

  ctx.body = {
    nid: news.nid,
  }
}

// 更新一条消息
const update = async (ctx) => {
  const opt = ctx.request.body
  const news = ctx.state.news
  const fields = [ 'title', 'content', 'status' ]
  fields.forEach((field) => {
    news[field] = opt[field]
  })
  try {
    await news.save()
    logger.info(`One news is updated" ${news.nid} -- ${news.title}`)
  } catch (e) {
    ctx.throw(400, e.message)
  }

  ctx.body = {
    nid: news.nid,
  }
}

// 删除一条消息
const del = async (ctx) => {
  const nid = ctx.params.nid

  try {
    await News.deleteOne({ nid }).exec()
    logger.info(`One news is delete ${nid}`)
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
