import type { Context } from 'koa'
import Router from '@koa/router'
import {
  DiscussionListQueryResultSchema,
  DiscussionListQuerySchema,
  ProblemCreatePayloadSchema,
  ProblemCreateResultSchema,
  ProblemDetailQueryResultSchema,
  ProblemItemListQueryResultSchema,
  ProblemItemListQuerySchema,
  ProblemListQueryResultSchema,
  ProblemListQuerySchema,
  ProblemSolutionListQueryResultSchema,
  ProblemSolutionListQuerySchema,
  ProblemStatisticsQueryResultSchema,
  ProblemUpdatePayloadSchema,
  ProblemUpdateResultSchema,
} from '@putongoj/shared'
import { isAdmin } from '../auth/user'
import { getDatabase } from '../config/postgres'
import { loadProfile, loginRequire, rootRequire } from '../middlewares/authn'
import { loadCourseStateOrThrow } from '../policies/course'
import { loadProblemState } from '../policies/problem'
import courseService from '../services/course'
import discussionService from '../services/discussion'
import problemService from '../services/problem'
import solutionService from '../services/solution'
import tagService from '../services/tag'
import { createEnvelopedResponse, createZodErrorResponse } from '../utils'
import { ERR_PERM_DENIED } from '../utils/constants'

async function findProblems (ctx: Context) {
  const query = ProblemListQuerySchema.safeParse(ctx.request.query)
  if (!query.success) {
    return createZodErrorResponse(ctx, query.error)
  }
  const profile = ctx.state.profile
  const filters = {
    page: query.data.page,
    pageSize: query.data.pageSize,
    type: query.data.searchField,
    content: query.data.search,
  }

  const result = query.data.courseId
    ? await (async () => {
        const course = await loadCourseStateOrThrow(ctx, query.data.courseId)
        if (!course.role.canAccess) {
          return ctx.throw(...ERR_PERM_DENIED)
        }
        return await problemService.findCourseProblems(course.course.id, filters)
      })()
    : await problemService.findProblems({
        ...filters,
        showReserved: Boolean(profile !== undefined && isAdmin(profile)),
        ownerId: profile?.id,
      })

  let solved: number[] = []
  if (profile) {
    const database = await getDatabase()
    const statuses = await database.userProblemStatus.findMany({
      where: {
        userId: profile.id,
        problemId: { in: result.items.map(problem => problem.id) },
        hasAccepted: true,
      },
      select: { problemId: true },
    })
    solved = statuses.map(status => status.problemId)
  }

  return createEnvelopedResponse(ctx, ProblemListQueryResultSchema.encode({
    ...result,
    items: result.items.map(problem => ({
      ...problem,
      isOwner: problem.ownerId === profile?.id,
    })),
    solvedProblemIds: solved,
  }))
}

async function findProblemItems (ctx: Context) {
  const profile = await loadProfile(ctx)
  const query = ProblemItemListQuerySchema.safeParse(ctx.request.query)
  if (!query.success) {
    return createZodErrorResponse(ctx, query.error)
  }

  if (query.data.courseId) {
    const course = await loadCourseStateOrThrow(ctx, query.data.courseId)
    if (!course.role.canManageContests) {
      return ctx.throw(...ERR_PERM_DENIED)
    }
    const result = await problemService.findCourseProblemItems(course.course.id, query.data.keyword)
    return createEnvelopedResponse(ctx, ProblemItemListQueryResultSchema.encode(result))
  }
  if (!isAdmin(profile)) {
    return ctx.throw(...ERR_PERM_DENIED)
  }
  const result = await problemService.findProblemItems(query.data.keyword)
  return createEnvelopedResponse(ctx, ProblemItemListQueryResultSchema.encode(result))
}

async function getProblem (ctx: Context) {
  const state = await loadProblemState(ctx)
  if (!state) {
    return ctx.throw(404)
  }

  const problem = state.problem
  const profile = ctx.state.profile
  const isOwner = problem.ownerId === profile?.id
  const canManage = (profile !== undefined && isAdmin(profile)) || isOwner
  return createEnvelopedResponse(ctx, ProblemDetailQueryResultSchema.encode({
    id: problem.id,
    title: problem.title,
    timeLimitMs: problem.timeLimitMs,
    memoryLimitKb: problem.memoryLimitKb,
    description: problem.description,
    inputFormat: problem.inputFormat,
    outputFormat: problem.outputFormat,
    sampleInput: problem.sampleInput,
    sampleOutput: problem.sampleOutput,
    hint: problem.hint,
    visibility: problem.visibility,
    judgeType: problem.judgeType,
    judgeCode: canManage ? problem.judgeCode : undefined,
    ownerId: problem.ownerId,
    statistics: {
      submitterCount: problem.submissionStats?.submitterCount ?? 0,
      solverCount: problem.submissionStats?.solverCount ?? 0,
    },
    tags: problem.tags.map(item => item.tag),
    isOwner,
    createdAt: problem.createdAt,
    updatedAt: problem.updatedAt,
  }))
}

async function createProblem (ctx: Context) {
  const payload = ProblemCreatePayloadSchema.safeParse(ctx.request.body)
  if (!payload.success) {
    return createZodErrorResponse(ctx, payload.error)
  }

  const profile = await loadProfile(ctx)
  const { courseId, tagIds, ...problemData } = payload.data

  if (courseId !== undefined) {
    const course = await loadCourseStateOrThrow(ctx, courseId)
    if (!isAdmin(profile) && !course.role.canManageProblems) {
      return ctx.throw(...ERR_PERM_DENIED)
    }
  } else if (!isAdmin(profile)) {
    return ctx.throw(...ERR_PERM_DENIED)
  }

  const problem = await problemService.createProblem({
    ...problemData,
    tagIds: await tagService.getTagIds(tagIds),
    ownerId: profile.id,
  })
  if (courseId !== undefined) {
    await courseService.addCourseProblem(courseId, problem.id)
  }
  return createEnvelopedResponse(ctx, ProblemCreateResultSchema.encode({ id: problem.id }))
}

async function updateProblem (ctx: Context) {
  const state = await loadProblemState(ctx)
  const profile = await loadProfile(ctx)
  if (!state || (!isAdmin(profile) && state.problem.ownerId !== profile.id)) {
    return ctx.throw(...ERR_PERM_DENIED)
  }

  const payload = ProblemUpdatePayloadSchema.safeParse(ctx.request.body)
  if (!payload.success) {
    return createZodErrorResponse(ctx, payload.error)
  }

  const { tagIds, ...problemData } = payload.data
  const problem = await problemService.updateProblem(state.problem.id, {
    ...problemData,
    ...(tagIds === undefined ? {} : { tagIds: await tagService.getTagIds(tagIds) }),
  })
  return createEnvelopedResponse(ctx, ProblemUpdateResultSchema.encode({
    id: problem?.id ?? null,
    success: Boolean(problem),
  }))
}

async function removeProblem (ctx: Context) {
  await problemService.removeProblem(Number(ctx.params.problemId))
  ctx.body = {}
}

async function getStatistics (ctx: Context) {
  const state = await loadProblemState(ctx)
  if (!state) {
    return ctx.throw(404)
  }
  const result = await problemService.getStatistics(state.problem.id)
  return createEnvelopedResponse(ctx, ProblemStatisticsQueryResultSchema.encode(result))
}

async function findSolutions (ctx: Context) {
  const query = ProblemSolutionListQuerySchema.safeParse(ctx.request.query)
  if (!query.success) {
    return createZodErrorResponse(ctx, query.error)
  }
  const state = await loadProblemState(ctx)
  if (!state) {
    return ctx.throw(404)
  }

  const result = await solutionService.findSolutions({
    ...query.data,
    problemId: state.problem.id,
  })
  return createEnvelopedResponse(ctx, ProblemSolutionListQueryResultSchema.encode(result))
}

async function findProblemDiscussions (ctx: Context) {
  const query = DiscussionListQuerySchema.safeParse(ctx.request.query)
  if (!query.success) {
    return createZodErrorResponse(ctx, query.error)
  }
  const state = await loadProblemState(ctx)
  if (!state) {
    return ctx.throw(404)
  }
  const profile = ctx.state.profile

  const rows = await discussionService.findDiscussions(query.data, {
    problemId: state.problem.id,
    contestId: null,
    ...(query.data.authorId === undefined ? {} : { authorId: query.data.authorId }),
    ...(query.data.type === undefined ? {} : { types: [ query.data.type ] }),
    ...(profile !== undefined && isAdmin(profile) ? {} : { visibleToUserId: profile?.id ?? null }),
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
      problem: { id: state.problem.id },
      contest: null,
    })),
  }))
}

export default function registerProblemHandlers (router: Router) {
  const problemRouter = new Router({ prefix: '/problems' })
  problemRouter.get('/', findProblems)
  problemRouter.get('/items', loginRequire, findProblemItems)
  problemRouter.post('/', loginRequire, createProblem)
  problemRouter.get('/:problemId', getProblem)
  problemRouter.put('/:problemId', loginRequire, updateProblem)
  problemRouter.del('/:problemId', rootRequire, removeProblem)
  problemRouter.get('/:problemId/statistics', loginRequire, getStatistics)
  problemRouter.get('/:problemId/solutions', loginRequire, findSolutions)
  problemRouter.get('/:problemId/discussions', findProblemDiscussions)
  router.use(problemRouter.routes(), problemRouter.allowedMethods())
}
