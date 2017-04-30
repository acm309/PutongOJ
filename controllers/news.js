const News = require('../models/News')
const { extractPagination } = require('../utils')

/** 返回新闻列表 */
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
    pagination: extractPagination(res)
  }
}

/** 指定nid, 返回一条具体的新闻 */
async function queryOneNews (ctx, next) {
  const nid = +ctx.params.nid

  if (isNaN(nid)) {
    ctx.throw(400, 'Nid should be a number')
  }

  const news = await News
    .findOne({nid})
    .select('-_id title nid status create content')
    .exec()

  if (!news) {
    ctx.throw(400, 'No such a problem')
  }

  ctx.body = {
    news
  }
}

module.exports = {
  queryList,
  queryOneNews
}
