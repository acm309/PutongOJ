import type { Types } from '@putong-oj/db'
import type { CourseEntity } from '@putong-oj/shared'
import type { Context } from 'koa'
import type { DiscussionQueryFilters } from '../services/discussion.ts'
import type { WithId } from '../types/index.ts'
import Router from '@koa/router'
import { Problem, Solution, User } from '@putong-oj/db'
import {
  DiscussionListQueryResultSchema,
  DiscussionListQuerySchema,
  ErrorCode,
  JudgeStatus,
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
} from '@putong-oj/shared'
import { loadProfile, loginRequire, rootRequire } from '../middlewares/authn.ts'
import { loadCourseStateOrThrow } from '../policies/course.ts'
import { publicDiscussionTypes } from '../policies/discussion.ts'
import { loadProblemOrThrow } from '../policies/problem.ts'
import courseService from '../services/course.ts'
import discussionService from '../services/discussion.ts'
import problemService from '../services/problem.ts'
import solutionService from '../services/solution.ts'
import tagService from '../services/tag.ts'
import { getUser } from '../services/user.ts'
import { ERR_PERM_DENIED } from '../utils/constants.ts'
import { createEnvelopedResponse, createZodErrorResponse } from '../utils/index.ts'

function buildProblemList (
  list: Awaited<ReturnType<typeof problemService.findProblems>>,
  profileId?: Types.ObjectId,
) {
  return {
    ...list,
    docs: list.docs.map((problem) => {
      const { owner, ...item } = problem
      return {
        ...item,
        isOwner: profileId && owner ? owner.equals(profileId) : false,
      }
    }),
  }
}

async function findProblems (ctx: Context) {
  const query = ProblemListQuerySchema.safeParse(ctx.request.query)
  if (!query.success) {
    return createZodErrorResponse(ctx, query.error)
  }

  const profile = ctx.state.profile
  const { page, pageSize, course: courseId, type, content } = query.data

  if (page === -1 && profile?.isAdmin) {
    const total = await Problem.countDocuments()
    const result = total === 0
      ? { docs: [], limit: 0, page: 1, pages: 0, total: 0 }
      : await problemService.findProblems({
          page: 1,
          pageSize: total,
          showReserved: true,
          includeOwner: profile._id,
        })
    const list = buildProblemList(result as Awaited<ReturnType<typeof problemService.findProblems>>, profile._id)
    return createEnvelopedResponse(ctx, ProblemListQueryResultSchema.encode({ list, solved: [] }))
  }

  let courseDocId: Types.ObjectId | undefined
  if (courseId) {
    const { course, role } = await loadCourseStateOrThrow(ctx, courseId)
    if (!role.basic) {
      return ctx.throw(...ERR_PERM_DENIED)
    }
    courseDocId = course._id
  }

  const list = courseDocId
    ? await problemService.findCourseProblems(courseDocId, { page, pageSize, type, content })
    : await problemService.findProblems({
        page,
        pageSize,
        type,
        content,
        showReserved: !!profile?.isAdmin,
        includeOwner: profile?._id ?? null,
      })
  const result = buildProblemList(list, profile?._id)

  let solved: number[] = []
  if (profile && result.total > 0) {
    solved = await Solution
      .find({
        uid: profile.uid,
        pid: { $in: result.docs.map(problem => problem.pid) },
        judge: JudgeStatus.Accepted,
      })
      .distinct('pid')
      .lean()
  }

  return createEnvelopedResponse(ctx, ProblemListQueryResultSchema.encode({
    list: result,
    solved,
  }))
}

async function findProblemItems (ctx: Context) {
  const query = ProblemItemListQuerySchema.safeParse(ctx.request.query)
  if (!query.success) {
    return createZodErrorResponse(ctx, query.error)
  }

  const profile = await loadProfile(ctx)
  const { keyword, course: courseId } = query.data

  if (courseId) {
    const { course, role } = await loadCourseStateOrThrow(ctx, courseId)
    if (!role.manageContest) {
      return ctx.throw(...ERR_PERM_DENIED)
    }
    const result = await problemService.findCourseProblemItems(course._id, keyword)
    return createEnvelopedResponse(ctx, ProblemItemListQueryResultSchema.encode(result))
  }

  if (!profile.isAdmin) {
    return ctx.throw(...ERR_PERM_DENIED)
  }

  const result = await problemService.findProblemItems(keyword)
  return createEnvelopedResponse(ctx, ProblemItemListQueryResultSchema.encode(result))
}

async function getProblem (ctx: Context) {
  const problem = await loadProblemOrThrow(ctx)
  const profile = ctx.state.profile

  const isOwner = (profile?._id && problem.owner)
    ? problem.owner.equals(profile._id)
    : false
  const canManage = profile?.isAdmin ?? isOwner

  const result = ProblemDetailQueryResultSchema.encode({
    pid: problem.pid,
    title: problem.title,
    time: problem.time,
    memory: problem.memory,
    status: problem.status,
    description: problem.description,
    input: problem.input,
    output: problem.output,
    in: problem.in,
    out: problem.out,
    hint: problem.hint,
    type: canManage ? problem.type : undefined,
    code: canManage ? problem.code : undefined,
    tags: problem.tags.map(tag => ({
      tagId: tag.tagId,
      name: tag.name,
      color: tag.color,
    })),
    isOwner,
  })
  return createEnvelopedResponse(ctx, result)
}

async function createProblem (ctx: Context) {
  const payload = ProblemCreatePayloadSchema.safeParse(ctx.request.body)
  if (!payload.success) {
    return createZodErrorResponse(ctx, payload.error)
  }

  const profile = await loadProfile(ctx)
  const { course: courseId, ...problemData } = payload.data
  const hasPermission = async (): Promise<boolean> => {
    if (profile.isAdmin) {
      return true
    }
    if (courseId !== undefined) {
      const { role } = await loadCourseStateOrThrow(ctx, courseId)
      return role.manageProblem
    }
    return false
  }
  if (!await hasPermission()) {
    return ctx.throw(...ERR_PERM_DENIED)
  }

  let course: WithId<CourseEntity> | undefined
  if (courseId !== undefined) {
    course = (await loadCourseStateOrThrow(ctx, courseId)).course
  }

  try {
    const problem = await problemService.createProblem({
      ...problemData,
      owner: profile._id,
    })
    if (course) {
      await courseService.addCourseProblem(course._id, problem._id)
    }
    ctx.auditLog.info(`<Problem:${problem.pid}> created by <User:${profile.uid}>`)
    const result = ProblemCreateResultSchema.encode({ pid: problem.pid })
    return createEnvelopedResponse(ctx, result)
  } catch (error: any) {
    if (error.name === 'ValidationError') {
      return ctx.throw(ErrorCode.BadRequest, error.message)
    }
    throw error
  }
}

async function updateProblem (ctx: Context) {
  const payload = ProblemUpdatePayloadSchema.safeParse(ctx.request.body)
  if (!payload.success) {
    return createZodErrorResponse(ctx, payload.error)
  }

  const problem = await loadProblemOrThrow(ctx)
  const profile = await loadProfile(ctx)
  let canManage = profile.isAdmin
  if (!canManage && problem.owner) {
    const owner = await User.findById(problem.owner).lean()
    if (owner && owner.uid === profile.uid) {
      canManage = true
    }
  }
  if (!canManage) {
    return ctx.throw(...ERR_PERM_DENIED)
  }

  const { tags, ...problemData } = payload.data
  try {
    const updated = await problemService.updateProblem(problem.pid, {
      ...problemData,
      tags: tags === undefined
        ? undefined
        : await tagService.getTagObjectIds(tags),
    })
    ctx.auditLog.info(`<Problem:${problem.pid}> updated by <User:${profile.uid}>`)
    const result = ProblemUpdateResultSchema.encode({
      pid: updated?.pid ?? -1,
      success: !!updated,
    })
    return createEnvelopedResponse(ctx, result)
  } catch (error: any) {
    if (error.name === 'ValidationError') {
      return ctx.throw(ErrorCode.BadRequest, error.message)
    }
    throw error
  }
}

async function removeProblem (ctx: Context) {
  const pid = Number(ctx.params.pid)
  if (!Number.isInteger(pid) || pid <= 0) {
    return ctx.throw(ErrorCode.BadRequest, 'Invalid problem ID')
  }

  const profile = await loadProfile(ctx)
  try {
    await problemService.removeProblem(pid)
    ctx.auditLog.info(`<Problem:${pid}> removed by <User:${profile.uid}>`)
  } catch (error: any) {
    return ctx.throw(ErrorCode.BadRequest, error.message)
  }
  return createEnvelopedResponse(ctx, null)
}

async function getStatistics (ctx: Context) {
  const problem = await loadProblemOrThrow(ctx)
  const statistics = await problemService.getStatistics(problem._id)
  const result = ProblemStatisticsQueryResultSchema.encode(statistics)
  return createEnvelopedResponse(ctx, result)
}

export async function findSolutions (ctx: Context) {
  const query = ProblemSolutionListQuerySchema.safeParse(ctx.request.query)
  if (!query.success) {
    return createZodErrorResponse(ctx, query.error)
  }

  const problem = await loadProblemOrThrow(ctx)
  const solutions = await solutionService.findSolutions({
    ...query.data,
    problem: problem.pid,
  })
  const result = ProblemSolutionListQueryResultSchema.encode(solutions)
  return createEnvelopedResponse(ctx, result)
}

export async function findProblemDiscussions (ctx: Context) {
  const problem = await loadProblemOrThrow(ctx)
  const query = DiscussionListQuerySchema.safeParse(ctx.request.query)
  if (!query.success) {
    return createZodErrorResponse(ctx, query.error)
  }

  const { profile } = ctx.state
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
    { problem: problem._id, contest: null }, queryFilter,
  ]
  if (!(profile?.isAdmin)) {
    const visibilityFilters: DiscussionQueryFilters[] = [ {
      type: { $in: publicDiscussionTypes },
    } ]
    if (profile) {
      visibilityFilters.push({ author: profile._id })
    }
    filters.push({ $or: visibilityFilters })
  }

  const discussions = await discussionService.findDiscussions(
    { page, pageSize, sort, sortBy },
    { $and: filters },
    [ 'discussionId', 'author', 'type', 'pinned', 'title', 'createdAt', 'lastCommentAt', 'comments' ],
    { author: [ 'uid', 'avatar' ] },
  )
  const result = DiscussionListQueryResultSchema.encode({
    ...discussions,
    docs: discussions.docs.map(discussion => ({
      ...discussion, contest: null, problem: { pid: problem.pid },
    })),
  })
  return createEnvelopedResponse(ctx, result)
}

function registerProblemHandlers (router: Router) {
  const problemRouter = new Router({ prefix: '/problem' })

  problemRouter.get('/', findProblems)
  problemRouter.get('/items', loginRequire, findProblemItems)
  problemRouter.post('/', loginRequire, createProblem)
  problemRouter.get('/:pid', getProblem)
  problemRouter.put('/:pid', loginRequire, updateProblem)
  problemRouter.del('/:pid', rootRequire, removeProblem)
  problemRouter.get('/:pid/statistics', loginRequire, getStatistics)
  problemRouter.get('/:pid/solutions', loginRequire, findSolutions)
  problemRouter.get('/:pid/discussions', findProblemDiscussions)

  router.use(problemRouter.routes(), problemRouter.allowedMethods())
}

export default registerProblemHandlers
