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
  const res = await Solution.paginate(filter, {
    sort: { sid: -1 },
    page,
    limit: pageSize,
    select: '-_id -code -error'
  })

  ctx.body = {
    res
  }
}

// 返回一个提交
const findOne = async (ctx) => {
  const opt = parseInt(ctx.query.sid)
  const doc = await Solution.findOne({ sid: opt }).lean().exec()

  // 如果是 admin 请求，并且有 sim 值(有抄袭嫌隙)，那么也样将可能被抄袭的提交也返回
  if (isAdmin(ctx.session.profile) && doc.sim) {
    const simSolution = await Solution.findOne({ sid: doc.sim_s_id }).lean().exec()
    doc.simSolution = simSolution
  }

  ctx.body = {
    doc
  }
}

const create = async (ctx) => {
  const { pid, code, language } = ctx.request.body
  const { uid } = ctx.session.profile
  const solution = new Solution({
    pid: +pid,
    uid,
    code,
    language,
    length: Buffer.from(code).length // 这个属性是不是没啥用?
  })

  try {
    await solution.save()
    pushToJudge(solution.sid)
    logger.info(`One problem is created" ${solution.pid} -- ${solution.uid}`)
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
