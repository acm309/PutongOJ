const Solution = require('../models/Solution')
const Ids = require('../models/ID')
const { extractPagination, isUndefined } = require('../utils')

/**
  返回一个 solution 的列表，以时间降序（从晚到早的排）
*/
async function queryList (ctx, next) {
  const filter = {}
  ;['uid', 'pid', 'judge', 'language'].forEach((item) => {
    if (!isUndefined(ctx.query[item])) {
      filter[item] = ctx.query[item]
    }
  })

  const res = await Solution
    .paginate(filter, {
      limit: +ctx.query.limit || 30, // 加号表示使其变为数字
      page: +ctx.query.page || 1,
      sort: {sid: -1},
      // '-_id' 结果不包含 _id
      // http://stackoverflow.com/questions/9598505/mongoose-retrieving-data-without-id-field
      select: '-_id sid uid pid judge time memory language length create sim sim_s_id'
    })

  ctx.body = {
    solutions: res.docs,
    pagination: extractPagination(res)
  }
}

/**
  返回一个具体的solution
*/
async function queryOneSolution (ctx, next) {
  const sid = +ctx.params.sid // router 那的中间件已经保证这是数字了
  const solution = await Solution
    .findOne({sid})
    // 比上面函数里的 select 多了一个 code
    .select('-_id sid uid pid judge time memory language length create sim sim_s_id code error')
    .exec()

  if (!solution) {
    ctx.throw(400, 'No such a solution')
  }

  ctx.body = {
    solution
  }
}

/**
  创建新的提交
*/
async function create (ctx, next) {
  // 必备的字段
  ;['pid', 'code', 'language'].forEach((item) => {
    if (isUndefined(ctx.request.body[item])) {
      ctx.throw(400, `Field "${item}" is required`)
    }
  })

  const verified = Solution.validate(ctx.request.body)
  if (!verified.valid) {
    ctx.throw(400, verified.error)
  }

  const { pid, code, language } = ctx.request.body
  const mid = ctx.request.body['mid'] || 0
  const sid = await Ids.generateId('solution')
  const uid = ctx.session.user.uid

  const solution = new Solution({
    uid, sid, pid, mid, code, language: +language, length: code.length
  })

  await solution.save()
  await solution.pending()

  ctx.body = {
    solution: {
      sid, pid, mid, code, language, length: code.length
    }
  }
}

/**
  更新提交，其实就是 rejudge
*/
async function rejudge (ctx, next) {
  const sid = +ctx.params.sid
  const solution = await Solution
    .findOne({sid})
    .exec()

  if (!solution) {
    ctx.throw(400, 'No such a solution')
  }

  await solution.save()

  // 似乎可以不用等待?
  await solution.pending()
  ctx.body = {}
}

module.exports = {
  queryList,
  queryOneSolution,
  create,
  rejudge
}
