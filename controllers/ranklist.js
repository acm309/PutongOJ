const only = require('only')
const User = require('../models/User.js')
const { purify } = require('../utils/helper')

// 返回排名列表
const list = async (ctx) => {
  const opt = ctx.request.query
  const page = parseInt(opt.page) || 1
  const pageSize = parseInt(opt.pageSize) || 30
  const filter = purify(only(opt, 'mid'))
  const res = await User.paginate(filter, {
    sort: { solve: -1, submit: 1 },
    page,
    limit: pageSize,
    select: '-_id -pwd -privilege'
  })

  ctx.body = {
    res
  }
}

module.exports = {
  list
}
