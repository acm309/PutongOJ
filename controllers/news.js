const News = require('../models/News')

// 返回消息列表
const list = async (ctx) => {
  const filter = {}
  const opt = ctx.request.query
  const page = parseInt(opt.page) || 1
  const pageSize = parseInt(opt.pageSize) || 5
  const doc = await News
    .find(filter)
    .skip((page - 1) * pageSize)
    .limit(pageSize)
    .exec()
  ctx.body = doc
}

// 返回消息数量
const countNews = async (ctx) => {
  const filter = {}
  const doc = await News.count(filter).exec()
  ctx.body = doc
}

// 返回一道题目
const findOne = async (ctx) => {
  const opt = parseInt(ctx.query.nid)
  const doc = await News.findOne({nid: opt}).exec()
  ctx.body = doc
}

module.exports = {
  list,
  countNews,
  findOne
}
