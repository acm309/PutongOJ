const Problem = require('../models/Problem')
const Ids = require('../models/ID')
const { extractPagination, isUndefined, isAdmin } = require('../utils')
const fse = require('fs-extra')
const path = require('path')
const only = require('only')

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

  if (!ctx.session.user || ctx.session.user.privilege !== ctx.config.privilege.Admin) {
    filter['status'] = ctx.config.status.Available
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
    .select('-_id pid title memory time description input output in out hint status')
    .exec()

  if (!problem) {
    ctx.throw(400, 'No such a problem')
  }

  // 是在一般页面中查询，而非在比赛中查询，此时需要验证用户是否可以查看
  if (isUndefined(ctx.query.mid) && (problem.status === ctx.config.status.Reserve && !isAdmin(ctx.session.user))) {
    ctx.throw(400, 'No such a problem')
  }

  ctx.body = {
    problem
  }
}

/** 指定 pid, 更新一道已经存在的题目 */
async function update (ctx, next) {
  const pid = +ctx.params.pid // router 那儿的中间件已经保证这是数字了
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
  await problem.saveSample(ctx.config.DataRoot)

  ctx.body = {
    problem: {
      pid,
      title: problem.title,
      status: problem.status
    }
  }
}

async function del (ctx, next) {
  const pid = +ctx.params.pid
  const problem = await Problem
    .findOne({pid})
    .exec()

  if (!problem) {
    ctx.throw(400, 'No such a problem')
  }

  await Problem.deleteOne({pid}).exec()
  ctx.body = {}
}

async function create (ctx, next) {
  const verified = Problem.validate(ctx.request.body)
  if (!verified.valid) {
    ctx.throw(400, verified.error)
  }
  // 必须的字段只有 title， 其它都有默认值
  const title = ctx.request.body['title']
  if (isUndefined(title)) {
    ctx.throw(400, 'Title is required!')
  }
  const pid = await Ids.generateId('Problem')
  const problem = new Problem({
    pid,
    title
  })
  // 可选的其它字段
  ;['time', 'memory', 'description', 'in', 'out', 'input', 'output',
    'hint', 'status'].forEach((item) => {
      if (!isUndefined(ctx.request.body[item])) {
        problem[item] = ctx.request.body[item]
      }
    })

  await problem.save()
  await problem.saveSample(ctx.config.DataRoot)

  ctx.body = {
    problem: only(problem,
      ['pid', 'title', 'time', 'memory', 'description', 'in', 'out', 'input', 'output', 'hint', 'status'])
  }
}

async function testData (ctx, next) {
  const dataPath = ctx.request.body.files.file.path
  const type = ctx.query.type

  await fse.move(dataPath,
    path.resolve(ctx.config.DataRoot, `./${ctx.params.pid}/test.${type}`),
    {overwrite: true}
  )
  ctx.body = {}
}

module.exports = {
  queryList,
  queryOneProblem,
  update,
  del,
  create,
  testData
}
