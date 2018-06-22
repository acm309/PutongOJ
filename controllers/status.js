const only = require('only')
const Solution = require('../models/Solution')
const Contest = require('../models/Contest')
const { purify, isAdmin } = require('../utils/helper')
const logger = require('../utils/logger')
const redis = require('../config/redis')

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
  const opt = parseInt(ctx.params.sid)
  // 使用lean solution 就是一个 js 对象，没有 save 等方法
  const solution = await Solution.findOne({ sid: opt }).lean().exec()

  if (solution == null) ctx.throw(400, 'No such a solution')
  if (!isAdmin(ctx.session.profile) && solution.uid !== ctx.session.profile.uid) ctx.throw(403, 'Permission denied')

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
  if (opt.mid) {
    const cid = parseInt(opt.mid)
    const contest = await Contest.findOne({ cid }).exec()
    if (contest.end < Date.now()) {
      ctx.throw(400, 'Contest is ended!')
    }
  }

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
    redis.lpush('oj:solutions', solution.sid)
    logger.info(`One solution is created ${solution.pid} -- ${solution.uid}`)
  } catch (e) {
    ctx.throw(400, e.message)
  }

  ctx.body = {
    sid: solution.sid
  }
}

module.exports = {
  find,
  findOne,
  create
}
