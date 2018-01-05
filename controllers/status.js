const only = require('only')
const Solution = require('../models/Solution')
const { purify } = require('../utils/helper')

// 返回提交列表
const list = async (ctx) => {
  const opt = ctx.request.query
  const page = parseInt(opt.page) || 1
  const pageSize = parseInt(opt.pageSize) || 30
  const filter = purify(only(opt, 'uid pid judge language mid'))
  const res = await Solution.paginate(filter, {
    sort: { sid: -1 },
    page,
    limit: pageSize,
    select: '-_id -code -error'
  })

  ctx.body = {
    res
  }
}

// 返回一个提交
const findOne = async (ctx) => {
  const opt = parseInt(ctx.query.sid)
  const doc = await Solution.findOne({ sid: opt }).exec()

  ctx.body = {
    doc
  }
}

module.exports = {
  list,
  findOne
}
