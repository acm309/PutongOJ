const Solution = require('../models/Solution')
const Contest = require('../models/Contest')
const Ids = require('../models/ID')
const { extractPagination, isUndefined, isAdmin } = require('../utils')
const only = require('only')

/** 验证 sid 是否为数字以及 sid 对应的 Solution 是否存在 */
async function validateSid (sid, ctx, next) {
  if (isNaN(+sid)) {
    ctx.throw(400, 'Solution id (sid) should be a number')
  }

  const solution = await Solution.findOne({sid}).exec()
  if (!solution) {
    ctx.throw(400, 'No such a solution')
  }
  ctx.solution = solution
  return next()
}

/**
  返回一个 solution 的列表，以时间降序（从晚到早的排）
*/
async function queryList (ctx, next) {
  const filter = {}
  ;['uid', 'pid', 'judge', 'language', 'mid'].forEach((item) => {
    if (!isUndefined(ctx.query[item])) {
      filter[item] = ctx.query[item]
    }
  })

  // 默认为 module.Problem，此处要手动设置成 module.Contest
  if (!isUndefined(ctx.query['mid'])) {
    filter['module'] = ctx.config.module.Contest
  }

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
  const solution = ctx.solution

  const select = 'sid uid pid judge time memory language length create code error ' + (isAdmin(ctx.session.user) ? 'sim sim_s_id' : '')

  ctx.body = {
    solution: only(solution, select)
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
  const mid = ctx.request.body['mid']
  const sid = await Ids.generateId('solution')
  const uid = ctx.session.user.uid

  if (!isUndefined(mid)) {
    const contest = await Contest
      .findOne({ cid: mid })
      .exec()
    if (Date.now() < contest.start) {
      ctx.throw(400, 'This contest is on scheduled!')
    } else if (Date.now() > contest.end) {
      ctx.throw(400, 'This contest has ended!')
    }
  }

  const solution = isUndefined(mid)
    // 普通提交
    ? new Solution({ sid, pid, uid, mid: 1, code, language: +language, length: code.length })
    // 比赛提交
    : new Solution({ sid, pid, uid, mid, code, language: +language, length: code.length, module: ctx.config.module.Contest })

  await solution.save()
  // 使其开始判题
  await solution.pending()

  ctx.session.user.language = solution.language // 设置为默认选择的语言

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
  const solution = ctx.solution

  await solution.save()

  // 似乎可以不用等待?
  await solution.pending()
  ctx.body = {}
}

module.exports = {
  queryList,
  queryOneSolution,
  create,
  rejudge,
  validateSid
}
