import type { ContestModel } from '@putongoj/shared'
import type { Context } from 'koa'
import type { Types } from 'mongoose'
import type { DiscussionQueryFilters } from '../services/discussion'
import {
  ContestConfigEditPayloadSchema,
  ContestConfigQueryResultSchema,
  ContestCreatePayloadSchema,
  ContestDetailQueryResultSchema,
  ContestListQueryResultSchema,
  ContestListQuerySchema,
  ContestParticipatePayloadSchema,
  ContestParticipationQueryResultSchema,
  ContestRanklistQueryResultSchema,
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
import { loadProfile } from '../middlewares/authn'
import Group from '../models/Group'
import Problem from '../models/Problem'
import Solution from '../models/Solution'
import User from '../models/User'
import { loadContestState } from '../policies/contest'
import { loadCourseStateById, loadCourseStateOrThrow } from '../policies/course'
import { publicDiscussionTypes } from '../policies/discussion'
import { CacheKey, cacheService } from '../services/cache'
import { contestService } from '../services/contest'
import discussionService from '../services/discussion'
import solutionService from '../services/solution'
import { getUser } from '../services/user'
import {
  createEnvelopedResponse,
  createErrorResponse,
  createZodErrorResponse,
} from '../utils'
import { ERR_PERM_DENIED } from '../utils/constants'

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
    const { course, role } = await loadCourseStateOrThrow(ctx, courseId)
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
  const state = await loadContestState(ctx)
  if (!state) {
    return createErrorResponse(ctx, ErrorCode.NotFound, 'Contest not found or access denied')
  }

  const { contest, participation, isJury, isIpBlocked } = state
  const profile = await loadProfile(ctx)
  let canParticipate: boolean = false
  let canParticipateByPassword: boolean = false

  if (!isIpBlocked) {
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
  }

  const result = ContestParticipationQueryResultSchema.encode({
    isJury, participation, canParticipate, canParticipateByPassword, isIpBlocked,
  })
  return createEnvelopedResponse(ctx, result)
}

async function participateContest (ctx: Context) {
  const payload = ContestParticipatePayloadSchema.safeParse(ctx.request.body)
  if (!payload.success) {
    return createZodErrorResponse(ctx, payload.error)
  }
  const state = await loadContestState(ctx)
  if (!state) {
    return createErrorResponse(ctx, ErrorCode.NotFound, 'Contest not found or access denied')
  }
  const profile = await loadProfile(ctx)
  const { contest, participation, isJury } = state

  if (state.isIpBlocked) {
    return createErrorResponse(ctx, ErrorCode.Forbidden, 'Your IP address is not in the whitelist for this contest')
  }

  if (participation !== ParticipationStatus.NotApplied) {
    return createErrorResponse(ctx, ErrorCode.BadRequest, 'You have already participated in this contest')
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
    return createErrorResponse(ctx, ErrorCode.Forbidden, 'You cannot participate in this contest')
  }

  await contestService.updateParticipation(
    profile._id, contest._id, ParticipationStatus.Approved)
  ctx.auditLog.info(`<User:${profile.uid}> participated in contest <Contest:${contest.contestId}>`)
  return createEnvelopedResponse(ctx, null)
}

async function getContest (ctx: Context) {
  const state = await loadContestState(ctx)
  if (!state || !state.accessible) {
    return createErrorResponse(ctx, ErrorCode.NotFound, 'Contest not found or access denied')
  }
  const profile = await loadProfile(ctx)
  const { contest, isJury } = state

  const [ problemsBasic, attempted, solved ] = await Promise.all([
    contestService.getProblemsWithStats(contest._id, isJury),
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

  let course: { courseId: number, name: string } | null = null
  if (contest.course) {
    const courseState = await loadCourseStateById(ctx, contest.course)
    if (courseState) {
      const { courseId, name } = courseState.course
      course = { courseId, name }
    }
  }
  const result = ContestDetailQueryResultSchema.encode({
    ...contest, isJury, problems, course,
  })
  return createEnvelopedResponse(ctx, result)
}

async function getConfig (ctx: Context) {
  const state = await loadContestState(ctx)
  if (!state || !state.isJury) {
    return createErrorResponse(ctx, ErrorCode.NotFound, 'Contest not found or access denied')
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

  let course: { courseId: number, name: string } | null = null
  if (contest.course) {
    const courseState = await loadCourseStateById(ctx, contest.course)
    if (courseState) {
      const { courseId, name } = courseState.course
      course = { courseId, name }
    }
  }

  const result = ContestConfigQueryResultSchema.encode({
    ...contest,
    ipWhitelist,
    scoreboardFrozenAt: contest.scoreboardFrozenAt ?? null,
    scoreboardUnfrozenAt: contest.scoreboardUnfrozenAt ?? null,
    allowedUsers,
    allowedGroups,
    problems,
    course,
  })
  return createEnvelopedResponse(ctx, result)
}

async function updateConfig (ctx: Context) {
  const payload = ContestConfigEditPayloadSchema.safeParse(ctx.request.body)
  if (!payload.success) {
    return createZodErrorResponse(ctx, payload.error)
  }
  const state = await loadContestState(ctx)
  if (!state || !state.isJury) {
    return createErrorResponse(ctx, ErrorCode.NotFound, 'Contest not found or access denied')
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
      const courseDoc = await loadCourseStateOrThrow(ctx, payload.data.course)
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

  if (problems !== undefined) {
    await Promise.all([
      cacheService.remove(CacheKey.contestProblems(contest._id, true)),
      cacheService.remove(CacheKey.contestProblems(contest._id, false)),
    ])
  }

  return createEnvelopedResponse(ctx, null)
}

export async function getRanklist (ctx: Context) {
  const state = await loadContestState(ctx)
  if (!state || !state.accessible) {
    return createErrorResponse(ctx, ErrorCode.NotFound, 'Contest not found or access denied')
  }
  const { contest, isJury } = state

  const ranklist = await contestService.getRanklist(contest._id, isJury)
  const result = ContestRanklistQueryResultSchema.encode(ranklist)
  return createEnvelopedResponse(ctx, result)
}

export async function findSolutions (ctx: Context) {
  const query = ContestSolutionListQuerySchema.safeParse(ctx.request.query)
  if (!query.success) {
    return createZodErrorResponse(ctx, query.error)
  }
  const state = await loadContestState(ctx)
  if (!state || !state.isJury) {
    return createErrorResponse(ctx, ErrorCode.NotFound, 'Contest not found or access denied')
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
  const state = await loadContestState(ctx)
  if (!state || !state.isJury) {
    return createErrorResponse(ctx, ErrorCode.NotFound, 'Contest not found or access denied')
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
  const state = await loadContestState(ctx)
  if (!state || !state.accessible) {
    return createErrorResponse(ctx, ErrorCode.NotFound, 'Contest not found or access denied')
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

export async function createContest (ctx: Context) {
  const payload = ContestCreatePayloadSchema.safeParse(ctx.request.body)
  if (!payload.success) {
    return createZodErrorResponse(ctx, payload.error)
  }

  const opt = payload.data
  const profile = await loadProfile(ctx)
  const hasPermission = async (): Promise<boolean> => {
    if (profile.isAdmin) {
      return true
    }
    if (opt.course) {
      const { role } = await loadCourseStateOrThrow(ctx, opt.course)
      return role.manageContest
    }
    return false
  }
  if (!await hasPermission()) {
    return createErrorResponse(ctx, ErrorCode.Forbidden, 'Permission denied to create contest')
  }

  let course: Types.ObjectId | null = null
  if (opt.course) {
    const { course: { _id } } = await loadCourseStateOrThrow(ctx, opt.course)
    course = _id
  }

  try {
    const contest = await contestService.createContest({ ...opt, course })
    ctx.auditLog.info(`<Contest:${contest.contestId}> created by <User:${profile.uid}>`)
    return createEnvelopedResponse(ctx, { contestId: contest.contestId })
  } catch (e: any) {
    return createErrorResponse(ctx, ErrorCode.BadRequest, `Failed to create contest: ${e.message}`)
  }
}

const contestController = {
  loadContestState,
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
