import type { Context } from 'koa'
import Router from '@koa/router'
import {
  DiscussionListQueryResultSchema,
  DiscussionListQuerySchema,
  ProblemCreatePayloadSchema,
  ProblemSolutionListQueryResultSchema,
  ProblemSolutionListQuerySchema,
  ProblemStatisticsQueryResultSchema,
  ProblemUpdatePayloadSchema,
} from '@putongoj/shared'
import { getDatabase } from '../config/postgres'
import { loadProfile, loginRequire, rootRequire } from '../middlewares/authn'
import { toProblemDto } from '../persistence/mappers'
import { loadCourseStateOrThrow } from '../policies/course'
import { loadProblemState } from '../policies/problem'
import courseService from '../services/course'
import discussionService from '../services/discussion'
import problemService from '../services/problem'
import solutionService from '../services/solution'
import tagService from '../services/tag'
import { createEnvelopedResponse, createZodErrorResponse, parsePaginateOption } from '../utils'
import { ERR_PERM_DENIED } from '../utils/constants'

async function findProblems (ctx: Context) {
  const option = ctx.request.query
  const profile = ctx.state.profile
  const paginate = parsePaginateOption(option, 30, 100)
  const filters = {
    ...paginate,
    type: typeof option.type === 'string' ? option.type : undefined,
    content: typeof option.content === 'string' ? option.content : undefined,
  }

  const courseId = typeof option.courseId === 'string' ? Number(option.courseId) : undefined
  const list = courseId
    ? await (async () => {
        const course = await loadCourseStateOrThrow(ctx, courseId)
        if (!course.role.canAccess) {
          return ctx.throw(...ERR_PERM_DENIED)
        }
        return await problemService.findCourseProblems(course.course.id, filters)
      })()
    : await problemService.findProblems({
        ...filters,
        showReserved: Boolean(profile?.isAdmin),
        ownerId: profile?.id,
      })

  let solved: number[] = []
  if (profile) {
    const database = await getDatabase()
    const statuses = await database.userProblemStatus.findMany({
      where: {
        userId: profile.id,
        problemId: { in: list.items.map(problem => problem.id) },
        hasAccepted: true,
      },
      select: { problemId: true },
    })
    solved = statuses.map(status => status.problemId)
  }

  ctx.body = {
    list: {
      ...list,
      items: list.items.map(problem => ({
        ...problem,
        isOwner: problem.ownerId === profile?.id,
      })),
    },
    solvedProblemIds: solved,
  }
}

async function findProblemItems (ctx: Context) {
  const profile = await loadProfile(ctx)
  const courseId = typeof ctx.request.query.courseId === 'string'
    ? Number(ctx.request.query.courseId)
    : undefined
  const keyword = String(ctx.request.query.keyword ?? '')

  if (courseId) {
    const course = await loadCourseStateOrThrow(ctx, courseId)
    if (!course.role.canManageContests) {
      return ctx.throw(...ERR_PERM_DENIED)
    }
    ctx.body = await problemService.findCourseProblemItems(course.course.id, keyword)
    return
  }
  if (!profile.isAdmin) {
    return ctx.throw(...ERR_PERM_DENIED)
  }
  ctx.body = await problemService.findProblemItems(keyword)
}

async function getProblem (ctx: Context) {
  const state = await loadProblemState(ctx)
  if (!state) {
    return ctx.throw(404)
  }

  const problem = state.problem
  const profile = ctx.state.profile
  const isOwner = problem.ownerId === profile?.id
  const canManage = profile?.isAdmin || isOwner
  ctx.body = {
    ...toProblemDto(problem, problem.submissionStats),
    judgeCode: canManage ? problem.judgeCode : undefined,
    tags: problem.tags.map(item => item.tag),
    isOwner,
  }
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
    if (!profile.isAdmin && !course.role.canManageProblems) {
      return ctx.throw(...ERR_PERM_DENIED)
    }
  } else if (!profile.isAdmin) {
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
  ctx.body = { id: problem.id }
}

async function updateProblem (ctx: Context) {
  const state = await loadProblemState(ctx)
  const profile = await loadProfile(ctx)
  if (!state || (!profile.isAdmin && state.problem.ownerId !== profile.id)) {
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
  ctx.body = { id: problem?.id ?? null, success: Boolean(problem) }
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

  const rows = await discussionService.findDiscussions(query.data, {
    problemId: state.problem.id,
    contestId: null,
    ...(query.data.authorId === undefined ? {} : { authorId: query.data.authorId }),
    ...(query.data.type === undefined ? {} : { types: [ query.data.type ] }),
    ...(ctx.state.profile?.isAdmin ? {} : { visibleToUserId: ctx.state.profile?.id ?? null }),
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
