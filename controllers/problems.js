const Problem = require('../models/Problem')
const { extractPagination, isUndefined } = require('../utils')

/** 返回题目列表 */
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

  const res = await Problem
    .paginate(filter, {
      limit: +ctx.query.limit || 30, // 加号表示使其变为数字
      page: +ctx.query.page || 1,
      sort: {pid: 1},
      // '-_id' 结果不包含 _id
      // http://stackoverflow.com/questions/9598505/mongoose-retrieving-data-without-id-field
      select: '-_id title pid solve submit status'
    })

  ctx.body = {
    problems: res.docs,
    pagination: extractPagination(res)
  }
}

/** 指定pid, 返回一个具体的题目 */
async function queryOneProblem (ctx, next) {
  const pid = +ctx.params.pid
  if (isNaN(pid)) {
    ctx.throw(400, 'Pid should be a number')
  }

  const problem = await Problem
    .findOne({pid})
    .select('-_id pid title memory time description input output in out hint')
    .exec()

  if (!problem) {
    ctx.throw(400, 'No such a problem')
  }

  ctx.body = {
    problem
  }
}

/** 指定 pid, 更新一道已经存在的题目 */
async function update (ctx, next) {
  const pid = +ctx.params.pid
  if (isNaN(pid)) {
    ctx.throw(400, 'Pid should be a number')
  }

  const problem = await Problem
    .findOne({pid})
    .exec()

  if (!problem) {
    ctx.throw(400, 'No such a problem')
  }

  const verified = Problem.validate(ctx.request.body)
  if (!verified.valid) {
    ctx.throw(400, verified.error)
  }

  // 可更新的字段
  const fields = ['title', 'time', 'memory', 'input', 'output', 'in', 'out',
    'description', 'hint', 'status']

  fields.forEach((field) => {
    if (!isUndefined(ctx.request.body[field])) {
      problem[field] = ctx.request.body[field]
    }
  })

  await problem.save()

  ctx.body = {
    problem: {
      pid,
      title: problem.title
    }
  }
}

async function del (ctx, name) {
  const pid = +ctx.params.pid
  if (isNaN(pid)) {
    ctx.throw(400, 'Pid should be a number')
  }
  const problem = await Problem
    .findOne({pid})
    .exec()

  if (!problem) {
    ctx.throw(400, 'No such a problem')
  }

  await Problem.deleteOne({pid}).exec()
  ctx.body = {}
}

module.exports = {
  queryList,
  queryOneProblem,
  update,
  del
}
