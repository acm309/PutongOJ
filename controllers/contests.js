const Contest = require('../models/Contest')
const Problem = require('../models/Problem')
const Ids = require('../models/ID')
const { extractPagination, isUndefined } = require('../utils')

/** 返回比赛列表 */
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
    pagination: extractPagination(res)
  }
}

/** 指定cid, 返回一个比赛的具体信息 */
async function queryOneContest (ctx, next) {
  const cid = +ctx.params.cid
  if (isNaN(cid)) { // cid might be a string
    ctx.throw(400, 'Cid should be a number')
  }
  const contest = await Contest
    .findOne({cid})
    // argument 有时候可能是密码，因此这里不返回
    .select('-_id cid title encrypt start end list status')
    .exec()

  // 查无此比赛
  if (!contest) {
    ctx.throw(400, 'No such a contest')
  }
  ctx.body = {
    contest
  }
}

/**
  创建新的比赛
  Caveat:
    传 post 参数的时候，对应数字的字段显示的其实为 string 类型，比如 start，理应 int，
    但从 ctx.request.body 拿出来时为字符串
    即时如此，mongoose 会自动转换，但你作其它事时可能需要注意
*/
async function create (ctx, next) {
  // 必须的字段
  ;['title', 'start', 'end', 'list', 'encrypt', 'argument'].forEach((item) => {
    if (isUndefined(ctx.request.body[item])) {
      ctx.throw(400, `Field "${item}" is required to create a contest`)
    }
  })

  const verified = Contest.validate(ctx.request.body)
  if (!verified.valid) {
    ctx.throw(400, verified.error)
  }

  const cid = await Ids.generateId('Contest')
  const { title, start, end, list, encrypt, argument } = ctx.request.body

  // 检查列表里的题是否都存在
  const ps = await Promise.all(
    list.map((pid) => Problem.findOne({pid}).exec())
  )

  for (let i = 0; i < ps.length; i += 1) {
    if (!ps[i]) { // 这道题没找到，说明没这题
      ctx.throw(400, `Problem ${list[i]} not found`)
    }
  }

  const contest = new Contest({
    cid, title, start, end, list, encrypt, argument
  })
  await contest.save()
  ctx.body = {
    contest: {
      cid, title, start, end, list, encrypt, argument
    }
  }
}

async function update (ctx, next) {
  const cid = +ctx.params.cid
  if (isNaN(cid)) {
    ctx.throw(400, 'Cid should be a number')
  }
  const contest = await Contest
    .findOne({cid})
    .exec()

  // 查无此比赛
  if (!contest) {
    ctx.throw(400, 'No such a contest')
  }

  const verified = Contest.validate(ctx.request.body)
  if (!verified.valid) {
    ctx.throw(400, verified.error)
  }

  if (ctx.request.body['list']) {
    // 检查列表里的题是否都存在
    const ps = await Promise.all(
      ctx.request.body['list'].map((pid) => Problem.findOne({pid}).exec())
    )

    for (let i = 0; i < ps.length; i += 1) {
      if (!ps[i]) { // 这道题没找到，说明没这题
        ctx.throw(400, `Problem ${ctx.request.body['list'][i]} not found`)
      }
    }
  }

  ;['title', 'start', 'end', 'list', 'encrypt', 'argument'].forEach((item) => {
    if (!isUndefined(ctx.request.body[item])) {
      contest[item] = ctx.request.body[item]
    }
  })
  await contest.save()
  const { title, start, end, list } = contest
  ctx.body = {
    contest: { cid, title, start, end, list }
  }
}

module.exports = {
  queryList,
  queryOneContest,
  create,
  update
}
