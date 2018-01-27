const only = require('only')
const Contest = require('../models/Contest')
const Problem = require('../models/Problem')
const Solution = require('../models/Solution')
const User = require('../models/User')
const logger = require('../utils/logger')
const config = require('../config')
const redis = require('../config/redis')
const { isAdmin, pushToRank } = require('../utils/helper')

const preload = async (ctx, next) => {
  const cid = parseInt(ctx.params.cid)
  if (isNaN(cid)) ctx.throw(400, 'Cid has to be a number')
  const contest = await Contest.findOne({ cid }).exec()
  if (contest == null) ctx.throw(400, 'No such a contest')
  if (isAdmin(ctx.session.profile)) {
    ctx.state.contest = contest
    return next()
  }
  if (contest.start > Date.now()) {
    ctx.throw(400, "This contest hasn't started yet")
  }
  if (contest.encrypt !== 1 && ctx.session.profile.verifyContest.indexOf(contest.cid) === -1) {
    ctx.throw(400, 'You do not have permission to enter this competition!')
  }
  if (contest.encrypt === 1 && ctx.session.profile.verifyContest.indexOf(contest.cid) === -1) {
    ctx.session.profile.verifyContest.push(contest.cid)
  }
  ctx.state.contest = contest
  return next()
}

// 返回竞赛列表
const find = async (ctx) => {
  const opt = ctx.request.query
  const page = parseInt(opt.page) || 1
  const pageSize = parseInt(opt.pageSize) || 20
  const list = await Contest.paginate({}, {
    sort: { cid: -1 },
    page,
    limit: pageSize,
    select: '-_id -creator -argument' // -表示不要的字段
  })

  ctx.body = {
    list
  }
}

// 返回一个竞赛
const findOne = async (ctx) => {
  const opt = ctx.request.query
  const cid = parseInt(opt.cid)
  let contest = ctx.state.contest

  // 普通用户不能获取argument的值
  if (!ctx.session.profile || !isAdmin(ctx.session.profile)) {
    contest = only(contest, 'title start end encrypt list create status cid')
  }
  const list = contest.list
  const totalProblems = list.length
  let overview = []
  const procedure = list.map((pid, index) => {
    return Problem.findOne({pid}).exec()
      .then((problem) => {
        overview[index] = only(problem, 'title pid')
      })
      .then(() => {
        return Solution.count({pid, mid: cid}).exec()
      })
      .then((count) => {
        overview[index].submit = count
      })
      .then(() => {
        return Solution.count({pid, mid: cid, judge: 3}).exec()
      })
      .then((count) => {
        overview[index].solve = count
      })
  })
  await Promise.all(procedure)

  const uid = opt.uid
  let solved = []
  solved = await Solution
    .find({ uid, mid: cid, judge: 3 })
    .distinct('pid')
    .exec()

  ctx.body = {
    contest,
    overview,
    totalProblems,
    solved
  }
}

// 返回比赛排行榜
const ranklist = async (ctx) => {
  const ranklist = {}
  let res
  const deadline = 60 * 60 * 1000
  const cid = parseInt(ctx.query.cid)
  const solutions = await Solution.find({
    mid: cid
  })
  for (const solution of solutions) {
    const { uid } = solution
    const row = (uid in ranklist) ? ranklist[uid] : { uid }
    const { pid } = solution
    const item = (pid in row) ? row[pid] : {}
    if ('wa' in item) {
      if (item.wa >= 0) continue
      if (solution.judge === config.judge.Accepted) {
        item.wa = -item.wa
        item.create = solution.create
      } else item.wa --
    } else {
      if (solution.judge === config.judge.Accepted) {
        item.wa = 0
        item.create = solution.create
      } else item.wa = -1
    }
    row[pid] = item
    ranklist[uid] = row
  }
  await Promise.all(Object.keys(ranklist).map((uid) =>
    User
    .findOne({ uid })
    .exec()
    .then(user => { ranklist[user.uid].nick = user.nick })))

  if (Date.now() + deadline < ctx.state.contest.end) {
    pushToRank(JSON.stringify(ranklist))
    res = ranklist
  } else if (!isAdmin(ctx.session.profile) &&
    Date.now() + deadline > ctx.state.contest.end &&
    Date.now() < ctx.state.contest.end) {
    const mid = await redis.rpop('oj:ranklist')
    pushToRank(mid)
    res = JSON.parse(mid)
  } else {
    res = ranklist
  }
  ctx.body = {
    ranklist: res
  }
}

// 新建一个比赛
const create = async (ctx) => {
  const opt = ctx.request.body

  const contest = new Contest(Object.assign(
    only(opt, 'title encrypt list argument'),
    { // cid 会自动生成
      start: new Date(opt.start).getTime(),
      end: new Date(opt.end).getTime(),
      create: Date.now()
    }
  ))

  try {
    await contest.save()
    logger.info(`New problem is created" ${contest.cid} -- ${contest.title}`)
  } catch (e) {
    ctx.throw(400, e.message)
  }

  ctx.body = {
    cid: contest.cid
  }
}

// 更新一个比赛
const update = async (ctx) => {
  const opt = ctx.request.body
  const contest = await Contest.findOne({cid: opt.cid}).exec()
  const fileds = ['title', 'encrypt', 'list', 'argument', 'start', 'end', 'status']
  opt.start = new Date(opt.start).getTime()
  opt.end = new Date(opt.end).getTime()
  fileds.forEach((filed) => {
    contest[filed] = opt[filed]
  })
  try {
    await contest.save()
    logger.info(`One problem is updated" ${contest.cid} -- ${contest.title}`)
  } catch (e) {
    ctx.throw(400, e.message)
  }

  ctx.body = {
    cid: contest.cid
  }
}

// 删除一个比赛
const del = async (ctx) => {
  const cid = ctx.params.cid

  try {
    await Contest.deleteOne({cid}).exec()
    logger.info(`One Contest is delete ${cid}`)
  } catch (e) {
    ctx.throw(400, e.message)
  }

  ctx.body = {}
}

// 进入比赛前验证用户
const verify = async (ctx) => {
  const opt = ctx.request.body
  const cid = opt.cid
  // 普通用户的前端页面里没有argument的值，需要重新在数据库中找一遍
  const contest = await Contest.findOne({ cid }).exec()

  const enc = parseInt(contest.encrypt)
  const arg = contest.argument
  let isVerify
  if (enc === 2) {
    const uid = opt.uid
    const arr = arg.split('\r\n')
    if (arr.indexOf(uid) !== -1) {
      isVerify = true
    } else {
      isVerify = false
    }
  } else {
    const pwd = opt.pwd
    if (arg === pwd) {
      isVerify = true
    } else {
      isVerify = false
    }
  }
  if (isVerify) {
    ctx.session.profile.verifyContest.push(contest.cid)
  }
  ctx.body = {
    isVerify,
    profile: ctx.session.profile
  }
}

module.exports = {
  preload,
  find,
  findOne,
  ranklist,
  create,
  update,
  del,
  verify
}
