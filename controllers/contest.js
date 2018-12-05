const only = require('only')
const Contest = require('../models/Contest')
const Problem = require('../models/Problem')
const Solution = require('../models/Solution')
const User = require('../models/User')
const logger = require('../utils/logger')
const config = require('../config')
const redis = require('../config/redis')
const { isAdmin } = require('../utils/helper')

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
  if (contest.encrypt !== config.encrypt.Public && ctx.session.profile.verifyContest.indexOf(contest.cid) === -1) {
    ctx.throw(400, 'You do not have permission to enter this competition!')
  }
  if (contest.encrypt === config.encrypt.Public && ctx.session.profile.verifyContest.indexOf(contest.cid) === -1) {
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
  const opt = ctx.params
  const cid = parseInt(opt.cid)
  let contest = ctx.state.contest

  // 普通用户不能获取argument的值
  if (!ctx.session.profile || !isAdmin(ctx.session.profile)) {
    contest = only(contest, 'title start end encrypt list create status cid')
  }
  const list = contest.list
  const totalProblems = list.length
  const overview = []
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
        return Solution.count({ pid, mid: cid, judge: config.judge.Accepted }).exec()
      })
      .then((count) => {
        overview[index].solve = count
      })
  })
  await Promise.all(procedure)

  const uid = opt.uid
  let solved = []
  solved = await Solution
    .find({ uid, mid: cid, judge: config.judge.Accepted })
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
  const contest = ctx.state.contest.toObject()
  const { ranklist } = contest
  let res
  // 最小 10 分钟 或者 20% 的时长
  const deadline = Math.max(0.2 * (contest.end - contest.start), 10 * 60 * 1000)
  // const cid = parseInt(ctx.query.cid)
  // const solutions = await Solution.find({ mid: cid }).exec()
  // 临时注释，但请暂时不要删除
  // for (const solution of solutions) {
  //   const { uid } = solution
  //   const row = (uid in ranklist) ? ranklist[uid] : { uid }
  //   const { pid } = solution
  //   const item = (pid in row) ? row[pid] : {}
  //   if ('wa' in item) {
  //     if (item.wa >= 0) continue
  //     if (solution.judge === config.judge.Accepted) {
  //       item.wa = -item.wa
  //       item.create = solution.create
  //     } else item.wa --
  //   } else {
  //     if (solution.judge === config.judge.Accepted) {
  //       item.wa = 0
  //       item.create = solution.create
  //     } else item.wa = -1
  //   }
  //   row[pid] = item
  //   ranklist[uid] = row
  // }
  // ctx.state.contest.ranklist = ranklist
  // await ctx.state.contest.save()
  await Promise.all(Object.keys(ranklist).map((uid) =>
    User
      .findOne({ uid })
      .lean()
      .exec()
      .then(user => { ranklist[user.uid].nick = user.nick })))

  if (Date.now() + deadline < contest.end) {
    // 若比赛未进入最后一小时，最新的 ranklist 推到 redis 里
    const str = JSON.stringify(ranklist)
    await redis.set(`oj:ranklist:${contest.cid}`, str) // 更新该比赛的最新排名信息
    res = ranklist
  } else if (!isAdmin(ctx.session.profile) &&
    Date.now() + deadline > contest.end &&
    Date.now() < contest.end) {
    // 比赛最后一小时封榜，普通用户只能看到题目提交的变化
    const mid = await redis.get(`oj:ranklist:${contest.cid}`) // 获取 redis 中该比赛的排名信息
    res = JSON.parse(mid)
    Object.entries(ranklist).map(([uid, problems]) => {
      Object.entries(problems).map(([pid, sub]) => {
        if (sub.wa < 0) {
          res[uid][pid] = {
            wa: sub.wa
          }
        }
      })
    })
    const str = JSON.stringify(res)
    await redis.set(`oj:ranklist:${contest.cid}`, str) // 将更新后的 ranklist 更新到 redis
    res = ranklist
  } else {
    // 比赛结束或管理员，这边有个问题 管理员是否有权限在封榜时间看所有排名
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
      create: Date.now(),
      ranklist: {}
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
  const { cid } = ctx.params
  const contest = await Contest.findOne({ cid }).exec()
  const fields = ['title', 'encrypt', 'list', 'argument', 'start', 'end', 'status']
  opt.start = new Date(opt.start).getTime()
  opt.end = new Date(opt.end).getTime()
  fields.filter((field) => opt[field] != null).forEach((field) => {
    contest[field] = opt[field]
  })
  try {
    await contest.save()
    logger.info(`One contest is updated" ${contest.cid} -- ${contest.title}`)
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
    await Contest.deleteOne({ cid }).exec()
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
  const contest = await Contest.findOne({ cid }).lean().exec()

  const enc = parseInt(contest.encrypt)
  const arg = contest.argument
  let isVerify
  if (enc === config.encrypt.Private) {
    const uid = ctx.session.profile.uid
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
