const only = require('only')
const News = require('../models/News')
const logger = require('../utils/logger')

const preload = async (ctx, next) => {
  const nid = parseInt(ctx.params.nid)
  if (isNaN(nid)) ctx.throw(400, 'Nid has to be a number')
  const news = await News.findOne({ nid }).exec()
  if (news == null) ctx.throw(400, 'No such a news')
  ctx.state.news = news
  return next()
}

// 返回消息列表
const find = async (ctx) => {
  const filter = {}
  const opt = ctx.request.query
  const page = parseInt(opt.page) || 1
  const pageSize = parseInt(opt.pageSize) || 5
  const list = await News.paginate(filter, {
    sort: { nid: -1 },
    page,
    limit: pageSize,
    select: '-_id',
  })

  ctx.body = {
    list,
  }
}

// 返回一条消息
const findOne = async (ctx) => {
  const news = ctx.state.news
  ctx.body = {
    news,
  }
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
  const fields = [ 'title', 'content' ]
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
