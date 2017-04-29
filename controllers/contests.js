const Contest = require('../models/Contest')

async function queryList (ctx, next) {
  const filter = {} // 用于 mongoose 的筛选

  if (ctx.query.field) {
    // https://docs.mongodb.com/manual/reference/operator/query/where/
    // field 一般为 cid 或 title
    // ctx.query.query 表示搜获的内容
    // 使用 string 而不是 function 是因为，这里的 function 是不能访问到外部变量的
    // 用模板字符串生成筛选条件
    // 正则可以匹配更多的内容
    filter.$where =
      `${new RegExp(ctx.query.query, 'i')}.test(this["${ctx.query.field}"])`
  }

  const res = await Contest
    .paginate(filter, {
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
