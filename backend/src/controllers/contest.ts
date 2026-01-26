import type {
  ContestModel,
} from '@putongoj/shared'
import type { Context } from 'koa'
import type { Types } from 'mongoose'
import type { ContestWithCourse } from '../services/contest'
import type { DiscussionQueryFilters } from '../services/discussion'
import {
  ContestConfigEditPayloadSchema,
  ContestConfigQueryResultSchema,
  ContestDetailQueryResultSchema,
  ContestListQueryResultSchema,
  ContestListQuerySchema,
  ContestParticipatePayloadSchema,
  ContestParticipationQueryResultSchema,
  ContestSolutionListExportQueryResultSchema,
  ContestSolutionListExportQuerySchema,
  ContestSolutionListQueryResultSchema,
  ContestSolutionListQuerySchema,
  DiscussionListQueryResultSchema,
  DiscussionListQuerySchema,
  ErrorCode,
  JudgeStatus,
  ParticipationStatus,
} from '@putongoj/shared'
import redis from '../config/redis'
import { loadProfile } from '../middlewares/authn'
import Group from '../models/Group'
import Problem from '../models/Problem'
import Solution from '../models/Solution'
import User from '../models/User'
import { contestService } from '../services/contest'
import discussionService from '../services/discussion'
import solutionService from '../services/solution'
import { getUser } from '../services/user'
import {
  createEnvelopedResponse,
  createErrorResponse,
  createZodErrorResponse,
} from '../utils'
import { ERR_PERM_DENIED } from '../utils/error'
import { loadCourse } from './course'
import { publicDiscussionTypes } from './discussion'

// const { encrypt, judge } = constants

export interface ContestState {
  contest: ContestWithCourse
  accessible: boolean
  participation: ParticipationStatus
  isJury: boolean
}

export async function loadContest (ctx: Context, input?: number | string) {
  const contestId = Number(input ?? ctx.params.contestId)
  if (!Number.isInteger(contestId) || contestId <= 0) {
    return null
  }
  if (ctx.state.contest?.contest.contestId === contestId) {
    return ctx.state.contest
  }

  const contest = await contestService.getContest(contestId)
  if (!contest) {
    return null
  }

  const profile = await loadProfile(ctx)
  const participation = await contestService
    .getParticipation(profile._id, contest._id)

  let isJury: boolean = false
  if (profile.isAdmin) {
    isJury = true
  } else if (contest.course) {
    const { role } = await loadCourse(ctx, contest.course)
    if (!role.basic) {
      return null
    }
    if (role.manageContest) {
      isJury = true
    }
  }

  const state: ContestState = {
    contest, participation, isJury,
    accessible: participation === ParticipationStatus.Approved || isJury,
  }
  ctx.state.contest = state
  return state
}

async function findContests (ctx: Context) {
  const query = ContestListQuerySchema.safeParse(ctx.request.query)
  if (!query.success) {
    return createZodErrorResponse(ctx, query.error)
  }

  const { profile } = ctx.state
  const { page, pageSize, sort, sortBy, title, course: courseId } = query.data

  let showHidden: boolean = !!profile?.isAdmin
  let courseDocId: Types.ObjectId | undefined
  if (courseId) {
    const { course, role } = await loadCourse(ctx, courseId)
    if (!role.basic) {
      return ctx.throw(...ERR_PERM_DENIED)
    }
    if (role.manageContest) {
      showHidden = true
    }
    courseDocId = course._id
  }

  const contests = await contestService.findContests(
    { page, pageSize, sort, sortBy },
    { title, course: courseDocId }, showHidden)
  const result = ContestListQueryResultSchema.encode(contests)
  return createEnvelopedResponse(ctx, result)
}

async function getParticipation (ctx: Context) {
  const state = await loadContest(ctx)
  if (!state) {
    return createErrorResponse(ctx,
      'Contest not found or access denied', ErrorCode.NotFound,
    )
  }

  const { contest, participation, isJury } = state
  const profile = await loadProfile(ctx)
  let canParticipate: boolean = false
  let canParticipateByPassword: boolean = false

  if (contest.isPublic || isJury) {
    canParticipate = true
  } else {
    if (contest.password && contest.password.length > 0) {
      canParticipateByPassword = true
    }
    if (contest.allowedUsers.includes(profile._id)) {
      canParticipate = true
    }
    /**
     * @TODO allowed groups
     */
  }

  const result = ContestParticipationQueryResultSchema.encode({
    isJury, participation, canParticipate, canParticipateByPassword,
  })
  return createEnvelopedResponse(ctx, result)
}

async function participateContest (ctx: Context) {
  const payload = ContestParticipatePayloadSchema.safeParse(ctx.request.body)
  if (!payload.success) {
    return createZodErrorResponse(ctx, payload.error)
  }
  const state = await loadContest(ctx)
  if (!state) {
    return createErrorResponse(ctx,
      'Contest not found or access denied', ErrorCode.NotFound,
    )
  }
  const profile = await loadProfile(ctx)
  const { contest, participation, isJury } = state

  if (participation !== ParticipationStatus.NotApplied) {
    return createErrorResponse(ctx,
      'You have already participated in this contest', ErrorCode.BadRequest,
    )
  }

  let canParticipate: boolean = false
  if (contest.isPublic || isJury) {
    canParticipate = true
  } else {
    const pwd = payload.data.password ?? ''
    if (contest.password && contest.password.length > 0 && contest.password === pwd) {
      canParticipate = true
    }
  }
  if (!canParticipate) {
    return createErrorResponse(ctx,
      'You cannot participate in this contest', ErrorCode.Forbidden,
    )
  }

  await contestService.updateParticipation(
    profile._id, contest._id, ParticipationStatus.Approved)
  ctx.auditLog.info(`<User:${profile.uid}> participated in contest <Contest:${contest.contestId}>`)
  return createEnvelopedResponse(ctx, null)
}

async function getContest (ctx: Context) {
  const state = await loadContest(ctx)
  if (!state || !state.accessible) {
    return createErrorResponse(ctx,
      'Contest not found or access denied', ErrorCode.NotFound,
    )
  }
  const profile = await loadProfile(ctx)
  const { contest, isJury } = state

  const [ problemsBasic, attempted, solved ] = await Promise.all([
    contestService.getProblemsWithStats(contest.contestId, isJury),
    Solution.distinct('pid', {
      mid: contest.contestId, uid: profile.uid,
    }).lean(),
    Solution.distinct('pid', {
      mid: contest.contestId, uid: profile.uid, judge: JudgeStatus.Accepted,
    }).lean(),
  ])

  const problems = problemsBasic.map(problem => ({
    ...problem,
    isAttempted: attempted.includes(problem.problemId),
    isSolved: solved.includes(problem.problemId),
  }))

  const result = ContestDetailQueryResultSchema.encode({
    ...contest.toObject(), isJury, problems,
  })
  return createEnvelopedResponse(ctx, result)
}

async function getConfig (ctx: Context) {
  const state = await loadContest(ctx)
  if (!state || !state.isJury) {
    return createErrorResponse(ctx,
      'Contest not found or access denied', ErrorCode.NotFound,
    )
  }
  const { contest } = state

  const allowedUsers = (await User
    .find({ _id: { $in: contest.allowedUsers } })
    .select([ 'uid', 'nick' ])
    .lean()).map(({ uid, nick }) => ({ username: uid, nickname: nick }))
  const allowedGroups = (await Group
    .find({ _id: { $in: contest.allowedGroups } })
    .select([ 'gid', 'title' ])
    .lean()).map(({ gid, title }) => ({ groupId: gid, name: title }))
  const problems = (await Problem
    .find({ _id: { $in: contest.problems } })
    .select([ 'pid', 'title' ])
    .lean()).sort((a, b) => {
    return contest.problems.indexOf(a._id) - contest.problems.indexOf(b._id)
  }).map(({ pid, title }) => ({ problemId: pid, title }))

  const ipWhitelist = (contest.ipWhitelist ?? []).map((entry: any) => ({
    cidr: entry.cidr,
    comment: entry.comment === undefined ? null : entry.comment,
  }))
  const result = ContestConfigQueryResultSchema.encode({
    ...contest.toObject(),
    ipWhitelist,
    scoreboardFrozenAt: contest.scoreboardFrozenAt ?? null,
    scoreboardUnfrozenAt: contest.scoreboardUnfrozenAt ?? null,
    allowedUsers,
    allowedGroups,
    problems,
  })
  return createEnvelopedResponse(ctx, result)
}

async function updateConfig (ctx: Context) {
  const payload = ContestConfigEditPayloadSchema.safeParse(ctx.request.body)
  if (!payload.success) {
    return createZodErrorResponse(ctx, payload.error)
  }
  const state = await loadContest(ctx)
  if (!state || !state.isJury) {
    return createErrorResponse(ctx,
      'Contest not found or access denied', ErrorCode.NotFound,
    )
  }
  const profile = await loadProfile(ctx)
  const { contest } = state

  let allowedUsers: Types.ObjectId[] | undefined
  if (payload.data.allowedUsers !== undefined) {
    const users = await User.find({ uid: { $in: payload.data.allowedUsers } }).select([ '_id' ]).lean()
    allowedUsers = users.map(u => u._id)
  }
  let allowedGroups: Types.ObjectId[] | undefined
  if (payload.data.allowedGroups !== undefined) {
    const groups = await Group.find({ gid: { $in: payload.data.allowedGroups } }).select([ '_id' ]).lean()
    allowedGroups = groups.map(g => g._id)
  }
  let ipWhitelist: { cidr: string, comment: string | null }[] | undefined
  if (payload.data.ipWhitelist !== undefined) {
    ipWhitelist = payload.data.ipWhitelist.map(entry => ({
      cidr: entry.cidr,
      comment: entry.comment === undefined ? null : entry.comment,
    }))
  }
  let problems: Types.ObjectId[] | undefined
  if (payload.data.problems !== undefined) {
    const problemsOrder = payload.data.problems
    const problemsDocs = await Problem.find({ pid: { $in: payload.data.problems } }).select([ '_id', 'pid' ]).lean()
    problems = problemsDocs.sort((a, b) => {
      return problemsOrder.indexOf(a.pid) - problemsOrder.indexOf(b.pid)
    }).map(p => p._id)
  }
  let course: Types.ObjectId | null | undefined
  if (profile.isRoot && payload.data.course !== undefined) {
    if (payload.data.course === null) {
      course = null
    } else {
      const courseDoc = await loadCourse(ctx, payload.data.course)
      course = courseDoc.course._id
    }
  }

  const data: Partial<ContestModel> = {
    ...payload.data,
    allowedUsers,
    allowedGroups, ipWhitelist,
    problems,
    course,
  }

  await contestService.updateContest(contest.contestId, data)
  ctx.auditLog.info(`<Contest:${contest.contestId}> config updated`)
  return createEnvelopedResponse(ctx, null)
}

const getRanklist = async (ctx: Context) => {
  const state = await loadContest(ctx)
  if (!state || !state.accessible) {
    return createErrorResponse(ctx,
      'Contest not found or access denied', ErrorCode.NotFound,
    )
  }
  const { contest, isJury } = state

  const nowDate = new Date()
  let isFrozen: boolean = false
  if (!isJury && contest.scoreboardFrozenAt) {
    if (nowDate >= contest.scoreboardFrozenAt) {
      isFrozen = true
    }
    if (contest.scoreboardUnfrozenAt && nowDate >= contest.scoreboardUnfrozenAt) {
      isFrozen = false
    }
  }

  const isEnded: boolean = nowDate >= contest.endsAt
  const freezeTime = contest.scoreboardFrozenAt?.getTime() ?? contest.endsAt.getTime()
  const info = { freezeTime, isFrozen, isEnded, isCache: false }

  const cacheKey = `ranklist:${contest.contestId}${isFrozen ? ':frozen' : ''}`
  const cache = await redis.get(cacheKey)
  if (cache) {
    info.isCache = true
    ctx.body = { ranklist: JSON.parse(cache), info }
    return
  }

  const ranklist = await contestService.getRanklist(contest.contestId, isFrozen, freezeTime)
  const cacheTime = isEnded ? 30 : 9
  await redis.set(cacheKey, JSON.stringify(ranklist), 'EX', cacheTime)
  ctx.auditLog.info(`<Contest:${contest.contestId}> ranklist updated${isFrozen ? ' (frozen)' : ''}`)
  ctx.body = { ranklist, info }
}

export async function findSolutions (ctx: Context) {
  const query = ContestSolutionListQuerySchema.safeParse(ctx.request.query)
  if (!query.success) {
    return createZodErrorResponse(ctx, query.error)
  }
  const state = await loadContest(ctx)
  if (!state || !state.isJury) {
    return createErrorResponse(ctx,
      'Contest not found or access denied', ErrorCode.NotFound,
    )
  }
  const { contest } = state
  const solutions = await solutionService.findSolutions({
    ...query.data,
    contest: contest.contestId,
  })
  const result = ContestSolutionListQueryResultSchema.encode(solutions)
  return createEnvelopedResponse(ctx, result)
}

export async function exportSolutions (ctx: Context) {
  const query = ContestSolutionListExportQuerySchema.safeParse(ctx.request.query)
  if (!query.success) {
    return createZodErrorResponse(ctx, query.error)
  }
  const state = await loadContest(ctx)
  if (!state || !state.isJury) {
    return createErrorResponse(ctx,
      'Contest not found or access denied', ErrorCode.NotFound,
    )
  }
  const { contest } = state
  const solutions = await solutionService.exportSolutions({
    ...query.data,
    contest: contest.contestId,
  })
  const result = ContestSolutionListExportQueryResultSchema.encode(solutions)
  return createEnvelopedResponse(ctx, result)
}

export async function findContestDiscussions (ctx: Context) {
  const query = DiscussionListQuerySchema.safeParse(ctx.request.query)
  if (!query.success) {
    return createZodErrorResponse(ctx, query.error)
  }
  const state = await loadContest(ctx)
  if (!state || !state.accessible) {
    return createErrorResponse(ctx,
      'Contest not found or access denied', ErrorCode.NotFound,
    )
  }
  const { contest } = state

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
      ...discussion, contest: { contestId: contest.contestId },
    })),
  })
  return createEnvelopedResponse(ctx, result)
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
    courseDocId = course._id
  }

  try {
    const contest = await contestService.createContest({
      startsAt: new Date(opt.start),
      endsAt: new Date(opt.end),
      course: courseDocId,
    })
    ctx.auditLog.info(`<Contest:${contest.contestId}> created by <User:${profile.uid}>`)
    ctx.body = { cid: contest.contestId }
  } catch (e: any) {
    ctx.throw(400, e.message)
  }
}

const contestController = {
  loadContest,
  findContests,
  createContest,
  getContest,
  getParticipation,
  participateContest,
  getRanklist,
  getConfig,
  updateConfig,
  findSolutions,
  exportSolutions,
  findContestDiscussions,
} as const

export default contestController
