import type { Context } from 'koa'
import type { ObjectId } from 'mongoose'
import type { ContestDocument } from '../models/Contest'
import type { SessionProfile } from '../types'
import { escapeRegExp, pick } from 'lodash'
import redis from '../config/redis'
import { loadProfile } from '../middlewares/authn'
import Contest from '../models/Contest'
import Group from '../models/Group'
import Problem from '../models/Problem'
import Solution from '../models/Solution'
import User from '../models/User'
import { parsePaginateOption } from '../utils'
import constants from '../utils/constants'
import { ERR_INVALID_ID, ERR_NOT_FOUND, ERR_PERM_DENIED } from '../utils/error'
import logger from '../utils/logger'
import { loadCourse } from './course'

const { encrypt, status, judge } = constants

export async function loadContest (
  ctx: Context,
  inputId?: string | number,
): Promise<ContestDocument> {
  const contestId = Number(
    inputId || ctx.params.cid || ctx.request.query.cid,
  )
  if (!Number.isInteger(contestId) || contestId <= 0) {
    return ctx.throw(...ERR_INVALID_ID)
  }
  if (ctx.state.contest?.cid === contestId) {
    return ctx.state.contest
  }

  const contest = await Contest.findOne({ cid: contestId }).populate('course')
  if (!contest) {
    return ctx.throw(...ERR_NOT_FOUND)
  }

  const profile = await loadProfile(ctx)
  if (profile.isAdmin) {
    ctx.state.contest = contest
    return contest
  }
  if (contest.course) {
    const { role } = await loadCourse(ctx, contest.course)
    if (!role.basic) {
      return ctx.throw(...ERR_PERM_DENIED)
    }
    if (role.manageContest) {
      ctx.state.contest = contest
      return contest
    }
  }
  if (contest.start > Date.now()) {
    return ctx.throw(400, 'This contest has not started yet')
  }

  const session = ctx.session.profile as SessionProfile
  if (!session.verifyContest) {
    session.verifyContest = []
  }
  if (session.verifyContest.includes(contest.cid)) {
    ctx.state.contest = contest
    return contest
  }

  if (contest.encrypt === encrypt.Public) {
    session.verifyContest.push(contest.cid)
    logger.info(`User <${profile.uid}> enter contest <${contest.cid}>`)
    ctx.state.contest = contest
    return contest
  }

  return ctx.throw(...ERR_PERM_DENIED)
}

const findContests = async (ctx: Context) => {
  const opt = ctx.request.query
  const profile = ctx.state.profile
  let showAll: boolean = !!profile?.isAdmin

  let courseDocId: ObjectId | undefined
  if (typeof opt.course === 'string') {
    const { course, role } = await loadCourse(ctx, opt.course)
    if (!role.basic) {
      return ctx.throw(...ERR_PERM_DENIED)
    }
    if (role.manageContest) {
      showAll = true
    }
    courseDocId = course.id
  }
  const { page, pageSize } = parsePaginateOption(opt, 20)
  const filters: Record<string, any>[] = []
  if (!showAll) {
    filters.push({ status: status.Available })
  }
  if (courseDocId) {
    filters.push({ course: courseDocId })
  } else if (!showAll) {
    filters.push({
      $or: [
        { course: { $exists: false } },
        { course: null } ],
    })
  }
  if (opt.type === 'title' && typeof opt.content === 'string') {
    filters.push({
      title: { $regex: new RegExp(escapeRegExp(opt.content), 'i') },
    })
  }

  const list = await Contest.paginate({ $and: filters }, {
    sort: { cid: -1 },
    page,
    limit: pageSize,
    lean: true,
    leanWithId: false,
    select: '-_id cid title start end encrypt status',
  })
  ctx.body = { list }
}

const getContest = async (ctx: Context) => {
  const profile = await loadProfile(ctx)
  const contest = await loadContest(ctx)
  const canViewMore = await (async (): Promise<boolean> => {
    if (profile.isAdmin) {
      return true
    }
    if (contest.course) {
      const { role } = await loadCourse(ctx, contest.course)
      return role.manageContest
    }
    return false
  })()

  const cid = contest.cid
  const problemList = contest.list
  const totalProblems = problemList.length

  const overview = await Promise.all(problemList.map(async (pid) => {
    const problem = await Problem.findOne({ pid }).lean().exec()
    if (!problem) { return { pid, invalid: true } }
    const { title } = problem
    const [ { length: submit }, { length: solve } ] = await Promise.all([
      Solution.distinct('uid', { pid, mid: cid }).lean().exec(),
      Solution.distinct('uid', { pid, mid: cid, judge: judge.Accepted }).lean().exec(),
    ])
    return { pid, title, solve, submit }
  }))
  const solved = profile
    ? await Solution
        .find({
          mid: cid,
          pid: { $in: problemList },
          uid: profile.uid,
          judge: judge.Accepted,
        })
        .distinct('pid')
        .lean()
        .exec()
    : []

  let course = null
  if (contest.course) {
    const { role } = await loadCourse(ctx, contest.course)
    course = {
      ...pick(contest.course, [ 'courseId', 'name', 'description', 'encrypt' ]),
      role,
    }
  }
  const contestData = pick(contest, [
    'cid', 'title', 'start', 'end', 'encrypt', 'status', 'list' ])
  const argument = canViewMore ? contest.argument : undefined
  ctx.body = {
    contest: {
      ...contestData,
      course,
      argument,
    },
    overview,
    totalProblems,
    solved,
  }
}

const getRanklist = async (ctx: Context) => {
  const profile = await loadProfile(ctx)
  const contest = await loadContest(ctx)
  const canViewMore = await (async (): Promise<boolean> => {
    if (profile.isAdmin) {
      return true
    }
    if (contest.course) {
      const { role } = await loadCourse(ctx, contest.course)
      return role.manageContest
    }
    return false
  })()

  // 封榜时长：20% 的比赛时间（最小 10 分钟）
  const FREEZE_DURATION_RATE = 0.2
  const MIN_FREEZE_DURATION = 10 * 60 * 1000

  const freezeDuration = Math.ceil(Math.max(
    FREEZE_DURATION_RATE * (contest.end - contest.start),
    MIN_FREEZE_DURATION))
  const freezeTime = contest.end - freezeDuration
  const isEnded = Date.now() > contest.end
  const isFrozen = !isEnded && Date.now() > freezeTime && !canViewMore
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
  const ranklist = {} as any
  submissions.forEach((submission: any) => {
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
    if (judge === judge.Pending || judge === judge.Running) {
      // 如果是 Pending / Running 视为无结果
      item.pending += 1
      return
    }
    if (judge === judge.Accepted) {
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
  logger.info(
    `Contest <${contest.cid}> has updated its `
    + `${isFrozen ? 'frozen ' : ''}ranklist and `
    + `cached for ${cacheTime} seconds`)
  ctx.body = { ranklist, info }
}

const createContest = async (ctx: Context) => {
  const opt = ctx.request.body
  const profile = await loadProfile(ctx)
  const hasPermission = async (): Promise<boolean> => {
    if (profile.isAdmin) {
      return true
    }
    if (opt.course) {
      const { role } = await loadCourse(ctx, opt.course)
      return role.manageContest
    }
    return false
  }
  if (!await hasPermission()) {
    return ctx.throw(...ERR_PERM_DENIED)
  }

  let courseDocId: ObjectId | undefined
  if (opt.course) {
    const { course } = await loadCourse(ctx, opt.course)
    courseDocId = course.id
  }

  const contest = new Contest({
    title: opt.title,
    encrypt: opt.encrypt,
    list: opt.list,
    argument: opt.argument,
    start: new Date(opt.start).getTime(),
    end: new Date(opt.end).getTime(),
    course: courseDocId,
  })

  try {
    await contest.save()
    logger.info(`Contest <${contest.cid}> is created by user <${profile.uid}>`)
  } catch (e: any) {
    ctx.throw(400, e.message)
  }

  ctx.body = {
    cid: contest.cid,
  }
}

const updateContest = async (ctx: Context) => {
  const opt = ctx.request.body
  const profile = await loadProfile(ctx)
  const contest = await loadContest(ctx)
  const hasPermission = async (): Promise<boolean> => {
    if (profile.isAdmin) {
      return true
    }
    if (contest.course) {
      const { role } = await loadCourse(ctx, contest.course)
      return role.manageContest
    }
    return false
  }
  if (!await hasPermission()) {
    return ctx.throw(...ERR_PERM_DENIED)
  }

  if (opt.title) { contest.title = opt.title }
  if (opt.encrypt) { contest.encrypt = opt.encrypt }
  if (opt.list) { contest.list = opt.list }
  if (opt.argument) { contest.argument = opt.argument }
  if (opt.start) { contest.start = new Date(opt.start).getTime() }
  if (opt.end) { contest.end = new Date(opt.end).getTime() }
  if (opt.status) { contest.status = opt.status }
  if (opt.course && Number.isInteger(Number(opt.course))) {
    if (Number(opt.course) === -1) {
      contest.course = null
    } else {
      const { course } = await loadCourse(ctx, opt.course)
      contest.course = course.id
    }
  }

  try {
    await contest.save()
    logger.info(`Contest <${contest.cid}> is updated by user <${profile.uid}>`)
  } catch (e: any) {
    ctx.throw(400, e.message)
  }

  ctx.body = {
    cid: contest.cid,
  }
}

const deleteContest = async (ctx: Context) => {
  const cid = ctx.params.cid
  const profile = await loadProfile(ctx)

  try {
    await Contest.deleteOne({ cid }).exec()
    logger.info(`Contest <${cid}> is deleted by user <${profile.uid}>`)
  } catch (e: any) {
    ctx.throw(400, e.message)
  }

  ctx.body = {}
}

const verifyParticipant = async (ctx: Context) => {
  const opt = ctx.request.body
  const cid = Number(opt.cid)
  if (!Number.isInteger(cid) || cid <= 0) {
    return ctx.throw(400, 'Invalid contest ID')
  }
  const session = ctx.session.profile as SessionProfile
  const profile = await loadProfile(ctx)
  const contest = await Contest.findOne({ cid })
  if (!contest) {
    return ctx.throw(...ERR_NOT_FOUND)
  }
  if (contest.course) {
    const { role } = await loadCourse(ctx, contest.course)
    if (!role.basic) {
      return ctx.throw(...ERR_PERM_DENIED)
    }
  }

  const enc = contest.encrypt
  const arg = contest.argument
  let isVerify = false
  if (enc === encrypt.Private) {
    const uid = profile.uid
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
  if (!session.verifyContest) {
    session.verifyContest = []
  }
  if (isVerify) {
    session.verifyContest.push(contest.cid)
    logger.info(`User <${profile.uid}> enter contest <${contest.cid}>`)
  }
  ctx.body = {
    isVerify,
    profile: {
      uid: profile.uid,
      nick: profile.nick,
      privilege: profile.privilege,
      verifyContest: session.verifyContest,
    },
  }
}

const contestController = {
  loadContest,
  findContests,
  getContest,
  getRanklist,
  createContest,
  updateContest,
  deleteContest,
  verifyParticipant,
}

export default module.exports = contestController
