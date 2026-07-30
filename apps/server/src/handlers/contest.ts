import type { Context } from 'koa'
import Router from '@koa/router'
import {
  ContestConfigEditPayloadSchema,
  ContestConfigQueryResultSchema,
  ContestCreatePayloadSchema,
  ContestCreateResultSchema,
  ContestDetailQueryResultSchema,
  ContestListQueryResultSchema,
  ContestListQuerySchema,
  ContestParticipantListQueryResultSchema,
  ContestParticipantListQuerySchema,
  ContestParticipantUpdatePayloadSchema,
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
  ParticipationStatus,
} from '@putongoj/shared'
import { isAdmin } from '../auth/user'
import { getDatabase } from '../config/postgres'
import { loadProfile, loginRequire } from '../middlewares/authn'
import { dataExportLimit } from '../middlewares/ratelimit'
import { loadContestState } from '../policies/contest'
import { loadCourseStateOrThrow } from '../policies/course'
import { CacheKey, cacheService } from '../services/cache'
import { contestService } from '../services/contest'
import discussionService from '../services/discussion'
import solutionService from '../services/solution'
import { createEnvelopedResponse, createErrorResponse, createZodErrorResponse } from '../utils'
import { ERR_PERM_DENIED } from '../utils/constants'

async function findContests (ctx: Context) {
  const query = ContestListQuerySchema.safeParse(ctx.request.query)
  if (!query.success) {
    return createZodErrorResponse(ctx, query.error)
  }

  let includeHidden = Boolean(ctx.state.profile !== undefined && isAdmin(ctx.state.profile))
  if (query.data.courseId) {
    const state = await loadCourseStateOrThrow(ctx, query.data.courseId)
    if (!state.role.canAccess) {
      return ctx.throw(...ERR_PERM_DENIED)
    }
    includeHidden ||= state.role.canManageContests
  }

  const rows = await contestService.findContests(
    query.data,
    { title: query.data.title, courseId: query.data.courseId },
    includeHidden,
  )
  return createEnvelopedResponse(ctx, ContestListQueryResultSchema.encode({
    ...rows,
    items: rows.items.map(contest => ({
      id: contest.id,
      title: contest.title,
      startsAt: contest.startsAt,
      endsAt: contest.endsAt,
      isPublic: contest.isPublic,
      ...(includeHidden ? { isHidden: contest.isHidden } : {}),
    })),
  }))
}

async function getParticipation (ctx: Context) {
  const state = await loadContestState(ctx)
  if (!state) {
    return createErrorResponse(ctx, ErrorCode.NotFound, 'Contest not found or access denied')
  }

  const canParticipate = !state.isIpBlocked && (state.isJury || state.contest.isPublic)
  return createEnvelopedResponse(ctx, ContestParticipationQueryResultSchema.encode({
    isJury: state.isJury,
    participationStatus: state.participation,
    canParticipate,
    canParticipateByPassword: !canParticipate && Boolean(state.contest.password),
    isIpBlocked: state.isIpBlocked,
    hasStarted: state.hasStarted,
    hasEnded: state.hasEnded,
  }))
}

async function participateContest (ctx: Context) {
  const payload = ContestParticipatePayloadSchema.safeParse(ctx.request.body)
  if (!payload.success) {
    return createZodErrorResponse(ctx, payload.error)
  }

  const state = await loadContestState(ctx)
  if (!state) {
    return createErrorResponse(ctx, ErrorCode.NotFound)
  }
  if (state.isIpBlocked) {
    return createErrorResponse(ctx, ErrorCode.Forbidden)
  }
  if (state.participation !== ParticipationStatus.NOT_APPLIED) {
    return createErrorResponse(ctx, ErrorCode.BadRequest)
  }
  const passwordMatches = Boolean(state.contest.password)
    && state.contest.password === payload.data.password
  if (!state.isJury && !state.contest.isPublic && !passwordMatches) {
    return createErrorResponse(ctx, ErrorCode.Forbidden)
  }

  const profile = await loadProfile(ctx)
  await contestService.updateParticipation(profile.id, state.contest.id, ParticipationStatus.APPROVED)
  return createEnvelopedResponse(ctx, null)
}

async function earlyExit (ctx: Context) {
  const state = await loadContestState(ctx)
  if (!state?.accessible) {
    return createErrorResponse(ctx, ErrorCode.NotFound)
  }
  if (!state.contest.allowEarlyExit || state.hasEnded) {
    return createErrorResponse(ctx, ErrorCode.Forbidden)
  }
  const profile = await loadProfile(ctx)
  await contestService.updateParticipation(profile.id, state.contest.id, ParticipationStatus.EARLY_EXIT)
  return createEnvelopedResponse(ctx, null)
}

async function getContest (ctx: Context) {
  const state = await loadContestState(ctx)
  if (!state?.accessible) {
    return createErrorResponse(ctx, ErrorCode.NotFound)
  }

  const profile = await loadProfile(ctx)
  const database = await getDatabase()
  const problemIds = state.contest.problems.map(problem => problem.problemId)
  const [ problems, statuses ] = await Promise.all([
    contestService.getProblemsWithStats(state.contest.id, state.isJury),
    database.userProblemStatus.findMany({
      where: { userId: profile.id, problemId: { in: problemIds } },
    }),
  ])

  return createEnvelopedResponse(ctx, ContestDetailQueryResultSchema.encode({
    id: state.contest.id,
    title: state.contest.title,
    startsAt: state.contest.startsAt,
    endsAt: state.contest.endsAt,
    isPublic: state.contest.isPublic,
    isHidden: state.contest.isHidden,
    isJury: state.isJury,
    allowedLanguages: state.contest.allowedLanguages,
    allowEarlyExit: state.contest.allowEarlyExit,
    labelingStyle: state.contest.labelingStyle,
    course: state.contest.course,
    problems: problems.map(problem => ({
      ...problem,
      isAttempted: statuses.some(status => status.problemId === problem.problemId && status.hasSubmitted),
      isSolved: statuses.some(status => status.problemId === problem.problemId && status.hasAccepted),
    })),
  }))
}

async function findParticipants (ctx: Context) {
  const query = ContestParticipantListQuerySchema.safeParse(ctx.request.query)
  if (!query.success) {
    return createZodErrorResponse(ctx, query.error)
  }
  const state = await loadContestState(ctx)
  if (!state?.isJury) {
    return createErrorResponse(ctx, ErrorCode.NotFound)
  }

  const result = await contestService.findParticipants(state.contest.id, query.data, {
    username: query.data.username,
    status: query.data.status,
  })
  return createEnvelopedResponse(ctx, ContestParticipantListQueryResultSchema.encode(result))
}

async function updateParticipantStatus (ctx: Context) {
  const payload = ContestParticipantUpdatePayloadSchema.safeParse(ctx.request.body)
  if (!payload.success) {
    return createZodErrorResponse(ctx, payload.error)
  }
  const state = await loadContestState(ctx)
  const userId = Number(ctx.params.userId)
  if (!state?.isJury || !Number.isInteger(userId) || userId <= 0) {
    return createErrorResponse(ctx, ErrorCode.NotFound)
  }

  await contestService.updateParticipantStatus(userId, state.contest.id, payload.data.status)
  return createEnvelopedResponse(ctx, null)
}

async function getConfig (ctx: Context) {
  const state = await loadContestState(ctx)
  if (!state?.isJury) {
    return createErrorResponse(ctx, ErrorCode.NotFound)
  }

  const database = await getDatabase()
  const [ users, groups ] = await Promise.all([
    database.contestAllowedUser.findMany({ where: { contestId: state.contest.id }, include: { user: true } }),
    database.contestAllowedGroup.findMany({ where: { contestId: state.contest.id }, include: { group: true } }),
  ])
  return createEnvelopedResponse(ctx, ContestConfigQueryResultSchema.encode({
    id: state.contest.id,
    title: state.contest.title,
    startsAt: state.contest.startsAt,
    endsAt: state.contest.endsAt,
    scoreboardFrozenAt: state.contest.scoreboardFrozenAt,
    scoreboardUnfrozenAt: state.contest.scoreboardUnfrozenAt,
    isHidden: state.contest.isHidden,
    isLocked: state.contest.isLocked,
    isPublic: state.contest.isPublic,
    allowEarlyExit: state.contest.allowEarlyExit,
    password: state.contest.password || null,
    allowedLanguages: state.contest.allowedLanguages,
    labelingStyle: state.contest.labelingStyle,
    ipWhitelistEnabled: state.contest.ipWhitelistEnabled,
    ipWhitelist: state.contest.ipWhitelist,
    allowedUsers: users.map(item => ({
      id: item.user.id,
      username: item.user.username,
      nickname: item.user.nickname,
    })),
    allowedGroups: groups.map(item => ({ id: item.group.id, name: item.group.name })),
    problems: state.contest.problems.map(item => ({
      position: item.position,
      problemId: item.problemId,
      title: item.problem.title,
    })),
    course: state.contest.course,
  }))
}

async function updateConfig (ctx: Context) {
  const payload = ContestConfigEditPayloadSchema.safeParse(ctx.request.body)
  if (!payload.success) {
    return createZodErrorResponse(ctx, payload.error)
  }
  const state = await loadContestState(ctx)
  if (!state?.isJury) {
    return createErrorResponse(ctx, ErrorCode.NotFound)
  }

  const updated = await contestService.updateContest(state.contest.id, payload.data)
  if (!updated) {
    return createErrorResponse(ctx, ErrorCode.BadRequest)
  }
  await cacheService.remove(CacheKey.contestProblems(state.contest.id, true))
  await cacheService.remove(CacheKey.contestProblems(state.contest.id, false))
  return createEnvelopedResponse(ctx, null)
}

async function findContestDiscussions (ctx: Context) {
  const state = await loadContestState(ctx)
  if (!state?.accessible) {
    return createErrorResponse(ctx, ErrorCode.NotFound)
  }
  const query = DiscussionListQuerySchema.safeParse(ctx.request.query)
  if (!query.success) {
    return createZodErrorResponse(ctx, query.error)
  }
  const rows = await discussionService.findDiscussions(query.data, {
    contestId: state.contest.id,
    ...(query.data.authorId === undefined ? {} : { authorId: query.data.authorId }),
    ...(query.data.type === undefined ? {} : { types: [ query.data.type ] }),
    ...(state.isJury ? {} : { visibleToUserId: (await loadProfile(ctx)).id }),
  })
  return createEnvelopedResponse(ctx, DiscussionListQueryResultSchema.encode({
    ...rows,
    items: rows.items.map(discussion => ({
      ...discussion,
      author: {
        id: discussion.author.id,
        username: discussion.author.username,
        avatarUrl: discussion.author.avatarUrl,
      },
      problem: discussion.problem ? { id: discussion.problem.id } : null,
      contest: { id: state.contest.id },
    })),
  }))
}

async function getRanklist (ctx: Context) {
  const state = await loadContestState(ctx)
  if (!state?.accessible) {
    return createErrorResponse(ctx, ErrorCode.NotFound)
  }
  const result = await contestService.getRanklist(state.contest.id, state.isJury)
  return createEnvelopedResponse(ctx, ContestRanklistQueryResultSchema.encode(result))
}

async function findSolutions (ctx: Context) {
  const query = ContestSolutionListQuerySchema.safeParse(ctx.request.query)
  if (!query.success) {
    return createZodErrorResponse(ctx, query.error)
  }
  const state = await loadContestState(ctx)
  if (!state?.isJury) {
    return createErrorResponse(ctx, ErrorCode.NotFound)
  }

  const result = await solutionService.findSolutions({
    ...query.data,
    contestId: state.contest.id,
  })
  return createEnvelopedResponse(ctx, ContestSolutionListQueryResultSchema.encode(result))
}

async function exportSolutions (ctx: Context) {
  const query = ContestSolutionListExportQuerySchema.safeParse(ctx.request.query)
  if (!query.success) {
    return createZodErrorResponse(ctx, query.error)
  }
  const state = await loadContestState(ctx)
  if (!state?.isJury) {
    return createErrorResponse(ctx, ErrorCode.NotFound)
  }

  const result = await solutionService.exportSolutions({
    ...query.data,
    contestId: state.contest.id,
  })
  return createEnvelopedResponse(ctx, ContestSolutionListExportQueryResultSchema.encode(result))
}

async function createContest (ctx: Context) {
  const payload = ContestCreatePayloadSchema.safeParse(ctx.request.body)
  if (!payload.success) {
    return createZodErrorResponse(ctx, payload.error)
  }

  const profile = await loadProfile(ctx)
  if (!isAdmin(profile) && payload.data.courseId) {
    const state = await loadCourseStateOrThrow(ctx, payload.data.courseId)
    if (!state.role.canManageContests) {
      return createErrorResponse(ctx, ErrorCode.Forbidden)
    }
  } else if (!isAdmin(profile)) {
    return createErrorResponse(ctx, ErrorCode.Forbidden)
  }

  if (payload.data.endsAt <= payload.data.startsAt) {
    return createErrorResponse(ctx, ErrorCode.BadRequest, 'Contest end time must be after start time')
  }
  const contest = await contestService.createContest(payload.data)
  return createEnvelopedResponse(ctx, ContestCreateResultSchema.encode(contest))
}

export default function registerContestHandlers (router: Router) {
  const contestRouter = new Router({ prefix: '/contests' })
  contestRouter.get('/', findContests)
  contestRouter.get('/:contestId', loginRequire, getContest)
  contestRouter.get('/:contestId/participation', loginRequire, getParticipation)
  contestRouter.post('/:contestId/participation', loginRequire, participateContest)
  contestRouter.put('/:contestId/participation/early-exit', loginRequire, earlyExit)
  contestRouter.get('/:contestId/participants', loginRequire, findParticipants)
  contestRouter.put('/:contestId/participants/:userId', loginRequire, updateParticipantStatus)
  contestRouter.get('/:contestId/ranklist', loginRequire, getRanklist)
  contestRouter.get('/:contestId/discussions', loginRequire, findContestDiscussions)
  contestRouter.post('/', loginRequire, createContest)
  contestRouter.get('/:contestId/configs', loginRequire, getConfig)
  contestRouter.put('/:contestId/configs', loginRequire, updateConfig)
  contestRouter.get('/:contestId/solutions', loginRequire, findSolutions)
  contestRouter.get('/:contestId/solutions/export', loginRequire, dataExportLimit, exportSolutions)
  router.use(contestRouter.routes(), contestRouter.allowedMethods())
}
