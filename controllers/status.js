const only = require('only')
const Solution = require('../models/Solution')
const { purify, isAdmin, pushToJudge } = require('../utils/helper')
const logger = require('../utils/logger')

// 返回提交列表
const find = async (ctx) => {
  const opt = ctx.request.query
  const page = parseInt(opt.page) || 1
  const pageSize = parseInt(opt.pageSize) || 30
  const filter = purify(only(opt, 'uid pid judge language mid'))
  const list = await Solution.paginate(filter, {
    sort: { sid: -1 },
    page,
    limit: pageSize,
    select: '-_id -code -error'
  })

  ctx.body = {
    list
  }
}

// 返回一个提交
const findOne = async (ctx) => {
  const opt = parseInt(ctx.query.sid)
  // 使用lean solution就是一个js对象，没有save等方法
  const solution = await Solution.findOne({ sid: opt }).lean().exec()

  // 如果是 admin 请求，并且有 sim 值(有抄袭嫌隙)，那么也样将可能被抄袭的提交也返回
  if (isAdmin(ctx.session.profile) && solution.sim) {
    const simSolution = await Solution.findOne({ sid: solution.sim_s_id }).lean().exec()
    solution.simSolution = simSolution
  }

  ctx.body = {
    solution
  }
}

// 创建一个提交
const create = async (ctx) => {
  const opt = ctx.request.body
  const { pid, code, language } = opt
  const { uid } = ctx.session.profile
  const solution = new Solution({
    pid: +pid,
    uid,
    code,
    language,
    length: Buffer.from(code).length // 这个属性是不是没啥用?
  })

  if (opt.mid) {
    solution.mid = parseInt(opt.mid)
  }

  try {
    await solution.save()
    pushToJudge(solution.sid)
    logger.info(`One solution is created" ${solution.pid} -- ${solution.uid}`)
  } catch (e) {
    ctx.throw(400, e.message)
  }

  ctx.body = {}
}

module.exports = {
  find,
  findOne,
  create
}
