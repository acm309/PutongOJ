const News = require('../models/News')

async function queryList (ctx, next) {
  const res = await News
    .paginate({}, {
      limit: +ctx.query.limit || 30, // 加号表示使其变为数字
      page: +ctx.query.page || 1,
      sort: {cid: 1},
      // '-_id' 结果不包含 _id
      // http://stackoverflow.com/questions/9598505/mongoose-retrieving-data-without-id-field
      select: '-_id title nid status create'
    })

  ctx.body = {
    news: res.docs,
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
