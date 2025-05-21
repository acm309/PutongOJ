const escapeRegExp = require('lodash/escapeRegExp')
const only = require('only')
const config = require('../config')
const redis = require('../config/redis')
const Contest = require('../models/Contest')
const Group = require('../models/Group')
const Problem = require('../models/Problem')
const Solution = require('../models/Solution')
const User = require('../models/User')
const { isAdmin } = require('../utils/helper')
const logger = require('../utils/logger')

const preload = async (ctx, next) => {
  const cid = Number(ctx.params.cid)
  if (!Number.isInteger(cid) || cid <= 0) {
    return ctx.throw(400, 'Invalid contest ID')
  }
  const contest = await Contest.findOne({ cid }).exec()
  if (!contest) {
    return ctx.throw(404, 'Contest not found')
  }

  const { profile } = ctx.session
  if (!Array.isArray(profile.verifyContest)) {
    profile.verifyContest = []
  }
  if (!isAdmin(profile)) {
    if (contest.start > Date.now()) {
      return ctx.throw(400, 'This contest has not started yet')
    }
    if (!profile.verifyContest.includes(cid)) {
      if (contest.encrypt === config.encrypt.Public) {
        profile.verifyContest.push(contest.cid)
        logger.info(`User <${profile.uid}> enter contest <${contest.cid}>`)
      } else {
        return ctx.throw(400, 'You have not verified to enter this contest')
      }
    }
  }

  ctx.state.contest = contest
  return next()
}

/**
 * 返回竞赛列表
 */
const find = async (ctx) => {
  const opt = ctx.request.query
  const profile = ctx.session.profile
  const page = Number.parseInt(opt.page) || 1
  const pageSize = Number.parseInt(opt.pageSize) || 20
  const filterType = String(opt.type || '')
  const filterContent = String(opt.content || '')

  const filter = !isAdmin(profile)
    ? { status: config.status.Available }
    : {}
  if (filterType === 'title') {
    filter.title = { $regex: new RegExp(escapeRegExp(filterContent), 'i') }
  }
  const list = await Contest.paginate(filter, {
    sort: { cid: -1 },
    page,
    limit: pageSize,
    lean: true,
    leanWithId: false,
    select: '-_id cid title start end encrypt status',
  })

  ctx.body = { list }
}

/**
 * 返回一个竞赛
 */
const findOne = async (ctx) => {
  const profile = ctx.session.profile
  const contest = ctx.state.contest
  const cid = contest.cid
  const problemList = contest.list
  const totalProblems = problemList.length

  const overview = await Promise.all(problemList.map(async (pid) => {
    const problem = await Problem.findOne({ pid }).lean().exec()
    if (!problem) { return { pid, invalid: true } }
    const { title } = problem
    const [ solve, submit ] = await Promise.all([
      Solution.countDocuments({ pid, mid: cid, judge: config.judge.Accepted }).lean().exec(),
      Solution.countDocuments({ pid, mid: cid }).lean().exec(),
    ])
    return { pid, title, solve, submit }
  }))
  const solved = profile
    ? await Solution
      .find({
        mid: cid,
        pid: { $in: problemList },
        uid: profile.uid,
        judge: config.judge.Accepted,
      })
      .distinct('pid')
      .lean()
      .exec()
    : []

  ctx.body = {
    contest: isAdmin(profile)
      ? only(contest, 'cid title start end encrypt status list argument create')
      : only(contest, 'cid title start end encrypt status list'),
    overview,
    totalProblems,
    solved,
  }
}

/**
 * 返回比赛排行榜
 */
const ranklist = async (ctx) => {
  const { contest, profile } = ctx.state

  // 封榜时长：20% 的比赛时间（最小 10 分钟）
  const FREEZE_DURATION_RATE = 0.2
  const MIN_FREEZE_DURATION = 10 * 60 * 1000

  const freezeDuration = Math.ceil(Math.max(
    FREEZE_DURATION_RATE * (contest.end - contest.start),
    MIN_FREEZE_DURATION))
  const freezeTime = contest.end - freezeDuration
  const isEnded = Date.now() > contest.end
  const isFrozen = !isEnded && Date.now() > freezeTime && !isAdmin(profile)
  const info = { freezeTime, isFrozen, isEnded, isCache: false }

  const cacheKey = `ranklist:${contest.cid}${isFrozen ? ':frozen' : ''}`
  const cache = await redis.get(cacheKey)
  if (cache) {
    info.isCache = true
    ctx.body = { ranklist: JSON.parse(cache), info }
    return
  }

  const submissions = await Solution
    .find(
      { mid: contest.cid },
      { _id: 0, pid: 1, uid: 1, judge: 1, create: 1 },
    )
    .sort({ create: 1 })
    .lean()
    .exec()

  const uidSet = new Set()
  const ranklist = {}
  submissions.forEach((submission) => {
    const { pid, uid, judge, create } = submission

    if (!ranklist[uid]) {
      ranklist[uid] = {}
      uidSet.add(uid)
    }
    if (!ranklist[uid][pid]) {
      ranklist[uid][pid] = {
        accepted: -1, // 第一个正确提交的时间（若无则为 -1）
        failed: 0, // 错误提交的计数
        pending: 0, // 无结果的提交计数
      }
    }
    const item = ranklist[uid][pid]

    if (item.accepted > 0) {
      // 已经有正确提交了则不需要再更新了
      return
    }
    if (isFrozen && create >= freezeTime) {
      // 封榜时间内的提交视为无结果
      item.pending += 1
      return
    }
    if (judge === config.judge.Pending || judge === config.judge.Running) {
      // 如果是 Pending / Running 视为无结果
      item.pending += 1
      return
    }
    if (judge === config.judge.Accepted) {
      // 如果是 Accepted 视为正确提交
      item.accepted = create
    } else {
      // 否则视为错误提交
      item.failed += 1
    }
  })

  const users = await User
    .find(
      { uid: { $in: Array.from(uidSet) } },
      { _id: 0, uid: 1, nick: 1 },
    )
    .lean()
    .exec()
  const nickMap = Object.fromEntries(users.map(user => [ user.uid, user.nick ]))
  Object.keys(ranklist).forEach((uid) => {
    ranklist[uid].nick = nickMap[uid]
  })

  const cacheTime = isEnded ? 30 : 9
  await redis.set(cacheKey, JSON.stringify(ranklist), 'EX', cacheTime)
  ctx.body = { ranklist, info }
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
      ranklist: {},
    },
  ))

  try {
    await contest.save()
    logger.info(`New Contest is created ${contest.cid} -- ${contest.title}`)
  } catch (e) {
    ctx.throw(400, e.message)
  }

  ctx.body = {
    cid: contest.cid,
  }
}

// 更新一个比赛
const update = async (ctx) => {
  const opt = ctx.request.body
  const { cid } = ctx.params
  const contest = await Contest.findOne({ cid }).exec()
  const fields = [ 'title', 'encrypt', 'list', 'argument', 'start', 'end', 'status' ]

  opt.start = new Date(opt.start).getTime()
  opt.end = new Date(opt.end).getTime()

  fields.forEach((field) => {
    if (opt[field] !== undefined && opt[field] !== null) {
      contest[field] = opt[field]
    }
  })

  try {
    await contest.save()
    logger.info(`One contest is updated" ${contest.cid} -- ${contest.title}`)
  } catch (e) {
    ctx.throw(400, e.message)
  }

  ctx.body = {
    cid: contest.cid,
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

  const enc = Number.parseInt(contest.encrypt)
  const arg = contest.argument
  let isVerify = false
  if (enc === config.encrypt.Private) {
    const uid = ctx.session.profile.uid
    const arr = arg.split('\r\n')
    for (const item of arr) {
      if (item.startsWith('gid:')) {
        const gid = item.substring(4)
        const group = await Group.findOne({ gid: Number.parseInt(gid) }).exec()
        if (group != null && group.list.includes(uid)) {
          isVerify = true
          break
        }
      } else if (item === uid) {
        isVerify = true
        break
      }
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
    profile: only(ctx.session.profile, 'uid nick privilege verifyContest'),
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
  verify,
}
