const News = require('../models/News')

// 返回消息列表
const find = async (ctx) => {
  const filter = {}
  const opt = ctx.request.query
  const page = parseInt(opt.page) || 1
  const pageSize = parseInt(opt.pageSize) || 5
  const res = await News.paginate(filter, {
    sort: { nid: -1 },
    page,
    limit: pageSize,
    select: '-_id'
  })

  ctx.body = {
    res
  }
}

// 返回一道题目
const findOne = async (ctx) => {
  const opt = parseInt(ctx.query.nid)
  const res = await News.findOne({nid: opt}).exec()
  ctx.body = {
    res
  }
}

module.exports = {
  find,
  findOne
}
