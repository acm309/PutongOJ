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
      sort: {cid: 1},
      // '-_id' 结果不包含 _id
      // http://stackoverflow.com/questions/9598505/mongoose-retrieving-data-without-id-field
      select: '-_id title cid start end status encrypt'
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

async function queryOneContest (ctx, next) {
  const cid = +ctx.params.cid
  if (isNaN(cid)) { // cid might be a string
    ctx.throw('Cid should be a number')
  }
  const contest = await Contest
    .findOne({cid})
    .select('-_id argument cid title create encrypt start end list status')
    .exec()

  // 查无此比赛
  if (!contest) {
    ctx.throw('No such a contest')
  }
  ctx.body = {
    contest
  }
}

module.exports = {
  queryList,
  queryOneContest
}
