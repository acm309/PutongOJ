import type { Context } from 'koa'
import type { Types } from 'mongoose'
import type { ContestDocumentPopulated } from '../models/Contest'
import type { DiscussionQueryFilters } from '../services/discussion'
import type { SessionProfile } from '../types'
import { Buffer } from 'node:buffer'
import { md5 } from '@noble/hashes/legacy.js'
import {
  ContestSolutionListExportQueryResultSchema,
  ContestSolutionListExportQuerySchema,
  ContestSolutionListQueryResultSchema,
  ContestSolutionListQuerySchema,
  DiscussionListQueryResultSchema,
  DiscussionListQuerySchema,
  ErrorCode,
} from '@putongoj/shared'
import { pick } from 'lodash'
import redis from '../config/redis'
import { loadProfile } from '../middlewares/authn'
import Group from '../models/Group'
import Problem from '../models/Problem'
import Solution from '../models/Solution'
import contestService from '../services/contest'
import discussionService from '../services/discussion'
import solutionService from '../services/solution'
import { getUser } from '../services/user'
import {
  createEnvelopedResponse,
  createErrorResponse,
  createZodErrorResponse,
  parsePaginateOption,
} from '../utils'
import constants from '../utils/constants'
import { ERR_INVALID_ID, ERR_NOT_FOUND, ERR_PERM_DENIED } from '../utils/error'
import logger from '../utils/logger'
import { loadCourse } from './course'
import { publicDiscussionTypes } from './discussion'

const { encrypt, judge } = constants

export async function loadContest (
  ctx: Context,
  inputId?: string | number,
): Promise<ContestDocumentPopulated> {
  const contestId = Number(
    inputId || ctx.params.cid || ctx.request.query.cid,
  )
  if (!Number.isInteger(contestId) || contestId <= 0) {
    return ctx.throw(...ERR_INVALID_ID)
  }
  if (ctx.state.contest?.cid === contestId) {
    return ctx.state.contest
  }

  const contest = await contestService.getContest(contestId)
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

  let courseDocId: Types.ObjectId | undefined
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

  const paginateOption = parsePaginateOption(opt, 20)
  const type = typeof opt.type === 'string' ? opt.type : undefined
  const content = typeof opt.content === 'string' ? opt.content : undefined
  const list = await contestService.findContests({
    ...paginateOption, type, content,
  }, showAll, courseDocId)

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

  const problemListStrArr = Uint8Array.from(Buffer.from(problemList.join(',')))
  const problemListHash = Buffer.from(md5(problemListStrArr)).toString('hex')

  const cacheKey = `contest:overview:${cid}:${problemListHash}`
  const cache = await redis.get(cacheKey)
  let overview = null
  if (cache) {
    overview = JSON.parse(cache)
  } else {
    overview = await Promise.all(problemList.map(async (pid) => {
      const problem = await Problem.findOne({ pid }).lean().exec()
      if (!problem) { return { pid, invalid: true } }
      const { title } = problem
      const [ { length: submit }, { length: solve } ] = await Promise.all([
        Solution.distinct('uid', { pid, mid: cid }).lean().exec(),
        Solution.distinct('uid', { pid, mid: cid, judge: judge.Accepted }).lean().exec(),
      ])
      return { pid, title, solve, submit }
    }))
    await redis.set(cacheKey, JSON.stringify(overview), 'EX', 10)
  }

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
    'cid', 'title', 'start', 'end', 'encrypt', 'status', 'list', 'option' ])
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

  let courseDocId: Types.ObjectId | undefined
  if (opt.course) {
    const { course } = await loadCourse(ctx, opt.course)
    courseDocId = course.id
  }

  try {
    const contest = await contestService
      .createContest(Object.assign({}, opt, {
        start: new Date(opt.start).getTime(),
        end: new Date(opt.end).getTime(),
        course: courseDocId,
      }))
    logger.info(`Contest <${contest.cid}> is created by user <${profile.uid}>`)
    ctx.body = { cid: contest.cid }
  } catch (e: any) {
    ctx.throw(400, e.message)
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

  let courseDocId: Types.ObjectId | undefined | null
  if (opt.course && Number.isInteger(Number(opt.course))) {
    if (Number(opt.course) === -1) {
      courseDocId = null
    } else {
      const { course } = await loadCourse(ctx, opt.course)
      courseDocId = course.id
    }
  }

  const cid = contest.cid
  try {
    await contestService.updateContest(cid,
      Object.assign({}, opt, {
        start: opt.start ? new Date(opt.start).getTime() : undefined,
        end: opt.end ? new Date(opt.end).getTime() : undefined,
        course: courseDocId,
      }))
    logger.info(`Contest <${cid}> is updated by user <${profile.uid}>`)
    ctx.body = { cid }
  } catch (e: any) {
    ctx.throw(400, e.message)
  }
}

const removeContest = async (ctx: Context) => {
  const cid = ctx.params.cid
  const profile = await loadProfile(ctx)

  try {
    await contestService.removeContest(Number(cid))
    logger.info(`Contest <${cid}> is deleted by user <${profile.uid}>`)
  } catch (e: any) {
    ctx.throw(400, e.message)
  }

  ctx.body = {}
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

  const ranklist = await contestService.getRanklist(contest.cid, isFrozen, freezeTime)
  const cacheTime = isEnded ? 30 : 9
  await redis.set(cacheKey, JSON.stringify(ranklist), 'EX', cacheTime)
  logger.info(
    `Contest <${contest.cid}> has updated its `
    + `${isFrozen ? 'frozen ' : ''}ranklist and `
    + `cached for ${cacheTime} seconds`)
  ctx.body = { ranklist, info }
}

const verifyParticipant = async (ctx: Context) => {
  const opt = ctx.request.body
  const cid = Number(opt.cid)
  if (!Number.isInteger(cid) || cid <= 0) {
    return ctx.throw(400, 'Invalid contest ID')
  }
  const session = ctx.session.profile as SessionProfile
  const profile = await loadProfile(ctx)
  const contest = await contestService.getContest(cid)
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

export async function managePermRequire (ctx: Context, next: () => Promise<any>) {
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
    return createErrorResponse(ctx,
      'You don\'t have permission to manage this contest', ErrorCode.Forbidden,
    )
  }
  await next()
}

export async function findSolutions (ctx: Context) {
  const query = ContestSolutionListQuerySchema.safeParse(ctx.request.query)
  if (!query.success) {
    return createZodErrorResponse(ctx, query.error)
  }

  const contest = await loadContest(ctx)
  const solutions = await solutionService.findSolutions({
    ...query.data,
    contest: contest.cid,
  })
  const result = ContestSolutionListQueryResultSchema.encode(solutions)
  return createEnvelopedResponse(ctx, result)
}

export async function exportSolutions (ctx: Context) {
  const query = ContestSolutionListExportQuerySchema.safeParse(ctx.request.query)
  if (!query.success) {
    return createZodErrorResponse(ctx, query.error)
  }

  const contest = await loadContest(ctx)
  const solutions = await solutionService.exportSolutions({
    ...query.data,
    contest: contest.cid,
  })
  const result = ContestSolutionListExportQueryResultSchema.encode(solutions)
  return createEnvelopedResponse(ctx, result)
}

export async function findContestDiscussions (ctx: Context) {
  const contest = await loadContest(ctx)
  const query = DiscussionListQuerySchema.safeParse(ctx.request.query)
  if (!query.success) {
    return createZodErrorResponse(ctx, query.error)
  }

  const profile = await loadProfile(ctx)
  const { page, pageSize, sort, sortBy, type, author } = query.data

  const queryFilter: DiscussionQueryFilters = {}
  if (type) {
    queryFilter.type = type
  }
  if (author) {
    const authorUser = await getUser(author)
    if (authorUser) {
      queryFilter.author = authorUser._id
    }
  }

  const filters: DiscussionQueryFilters[] = [
    { contest: contest._id }, queryFilter,
  ]
  if (!profile.isAdmin) {
    filters.push({
      $or: [
        { type: { $in: publicDiscussionTypes } },
        { author: profile._id },
      ],
    })
  }

  const discussions = await discussionService.findDiscussions(
    { page, pageSize, sort, sortBy },
    { $and: filters },
    [ 'discussionId', 'author', 'problem', 'type', 'pinned', 'title', 'createdAt', 'lastCommentAt', 'comments' ],
    { author: [ 'uid', 'avatar' ], problem: [ 'pid' ] },
  )
  const result = DiscussionListQueryResultSchema.encode({
    ...discussions,
    docs: discussions.docs.map(discussion => ({
      ...discussion, contest: { cid: contest.cid },
    })),
  })
  return createEnvelopedResponse(ctx, result)
}

const contestController = {
  loadContest,
  findContests,
  getContest,
  getRanklist,
  createContest,
  updateContest,
  removeContest,
  verifyParticipant,
  managePermRequire,
  findSolutions,
  exportSolutions,
  findContestDiscussions,
} as const

export default contestController
