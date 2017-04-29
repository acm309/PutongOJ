const Contest = require('../models/Contest')

async function queryList (ctx, next) {
  const res = await Contest
    .paginate({}, {
      limit: +ctx.query.limit || 30, // 加号表示使其变为数字
      page: +ctx.query.page || 1,
      sort: {cid: -1},
      select: 'title cid start end status encrypt'
    })
  ctx.body = {
    contests: res.docs,
    pagination: {
      limit: res.limit,
      page: +res.page,
      pages: res.pages,
      total: res.total
    }
  }
}

module.exports = {
  queryList
}
