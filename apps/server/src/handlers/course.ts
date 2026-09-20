import type { Context } from 'koa'
import Router from '@koa/router'
import { User } from '@putong-oj/db'
import {
  ContestListQueryResultSchema,
  CourseContestListQuerySchema,
  CourseCreatePayloadSchema,
  CourseCreateResultSchema,
  CourseDetailQueryResultSchema,
  CourseItemListQueryResultSchema,
  CourseItemListQuerySchema,
  CourseJoinPayloadSchema,
  CourseListQueryResultSchema,
  CourseListQuerySchema,
  CourseMemberListQueryResultSchema,
  CourseMemberListQuerySchema,
  CourseMemberQueryResultSchema,
  CourseMemberUpdatePayloadSchema,
  CourseMutationResultSchema,
  CourseProblemAddPayloadSchema,
  CourseProblemAddResultSchema,
  CourseProblemMovePayloadSchema,
  CourseUpdatePayloadSchema,
  ErrorCode,
} from '@putong-oj/shared'
import escapeRegExp from 'lodash/escapeRegExp.js'
import { adminRequire, loadProfile, loginRequire, rootRequire } from '../middlewares/authn.ts'
import { loadCourseState, loadCourseStateOrThrow } from '../policies/course.ts'
import { contestService } from '../services/contest.ts'
import courseService from '../services/course.ts'
import problemService from '../services/problem.ts'
import { ERR_INVALID_ID, ERR_NOT_FOUND, ERR_PERM_DENIED } from '../utils/constants.ts'
import {
  createEnvelopedResponse,
  createErrorResponse,
  createZodErrorResponse,
} from '../utils/index.ts'

async function findCourses (ctx: Context) {
  const query = CourseListQuerySchema.safeParse(ctx.request.query)
  if (!query.success) {
    return createZodErrorResponse(ctx, query.error)
  }

  const result = await courseService.findCourses(query.data)
  return createEnvelopedResponse(ctx, CourseListQueryResultSchema.encode(result))
}

async function findCourseItems (ctx: Context) {
  const query = CourseItemListQuerySchema.safeParse(ctx.request.query)
  if (!query.success) {
    return createZodErrorResponse(ctx, query.error)
  }

  const result = await courseService.findCourseItems(query.data.keyword.trim())
  return createEnvelopedResponse(ctx, CourseItemListQueryResultSchema.encode(result))
}

async function findCourseContests (ctx: Context) {
  const query = CourseContestListQuerySchema.safeParse(ctx.request.query)
  if (!query.success) {
    return createZodErrorResponse(ctx, query.error)
  }

  const state = await loadCourseState(ctx)
  if (!state) {
    return createErrorResponse(ctx, ErrorCode.NotFound, 'Course not found')
  }
  const { course, role } = state
  if (!role.basic) {
    return createErrorResponse(ctx, ErrorCode.Forbidden, 'Permission denied')
  }

  const { page, pageSize, sort, sortBy, title } = query.data
  const filters: Record<string, unknown> = { course: course._id }
  if (title) {
    filters.title = { $regex: new RegExp(escapeRegExp(title), 'i') }
  }
  if (!role.manageContest) {
    filters.isHidden = { $ne: true }
  }

  const contests = await contestService.findContests(
    { page, pageSize, sort, sortBy },
    filters,
  )
  const result = ContestListQueryResultSchema.encode(contests)
  return createEnvelopedResponse(ctx, result)
}

async function getCourse (ctx: Context) {
  const { course, role } = await loadCourseStateOrThrow(ctx)
  const result = CourseDetailQueryResultSchema.encode({
    courseId: course.courseId,
    name: course.name,
    description: course.description,
    encrypt: course.encrypt,
    joinCode: role.manageCourse ? course.joinCode : undefined,
    canJoin: (course.joinCode?.length ?? 0) > 0,
    role,
  })
  return createEnvelopedResponse(ctx, result)
}

async function joinCourse (ctx: Context) {
  const payload = CourseJoinPayloadSchema.safeParse(ctx.request.body)
  if (!payload.success) {
    return createZodErrorResponse(ctx, payload.error)
  }

  const { course, role } = await loadCourseStateOrThrow(ctx)
  const { joinCode } = payload.data
  if (!joinCode) {
    return createErrorResponse(ctx, ErrorCode.BadRequest, 'Missing join code')
  }
  if (course.joinCode.trim() !== joinCode) {
    return createErrorResponse(ctx, ErrorCode.Forbidden, 'Invalid join code')
  }

  const profile = await loadProfile(ctx)
  const result = await courseService.updateCourseMember(
    course._id,
    profile._id,
    { ...role, basic: true },
  )
  return createEnvelopedResponse(ctx, CourseMutationResultSchema.encode({ success: result }))
}

async function createCourse (ctx: Context) {
  const payload = CourseCreatePayloadSchema.safeParse(ctx.request.body)
  if (!payload.success) {
    return createZodErrorResponse(ctx, payload.error)
  }

  const profile = await loadProfile(ctx)
  try {
    const course = await courseService.createCourse(payload.data)
    ctx.auditLog.info(`<Course:${course.courseId}> created by <User:${profile.uid}>`)
    const result = CourseCreateResultSchema.encode({ courseId: course.courseId })
    return createEnvelopedResponse(ctx, result)
  } catch (err: any) {
    if (err.name === 'ValidationError') {
      return createErrorResponse(ctx, ErrorCode.BadRequest, err.message)
    }
    throw err
  }
}

async function updateCourse (ctx: Context) {
  const { course, role } = await loadCourseStateOrThrow(ctx)
  if (!role.manageCourse) {
    return ctx.throw(...ERR_PERM_DENIED)
  }

  const payload = CourseUpdatePayloadSchema.safeParse(ctx.request.body)
  if (!payload.success) {
    return createZodErrorResponse(ctx, payload.error)
  }

  const profile = await loadProfile(ctx)
  try {
    const updated = await courseService.updateCourse(course.courseId, payload.data)
    ctx.auditLog.info(`<Course:${course.courseId}> updated by <User:${profile.uid}>`)
    const result = CourseMutationResultSchema.encode({ success: !!updated })
    return createEnvelopedResponse(ctx, result)
  } catch (err: any) {
    if (err.name === 'ValidationError') {
      return createErrorResponse(ctx, ErrorCode.BadRequest, err.message)
    }
    throw err
  }
}

async function findCourseMembers (ctx: Context) {
  const { course, role } = await loadCourseStateOrThrow(ctx)
  if (!role.manageCourse) {
    return ctx.throw(...ERR_PERM_DENIED)
  }

  const query = CourseMemberListQuerySchema.safeParse(ctx.request.query)
  if (!query.success) {
    return createZodErrorResponse(ctx, query.error)
  }

  const result = await courseService.findCourseMembers(course._id, query.data)
  return createEnvelopedResponse(ctx, CourseMemberListQueryResultSchema.encode(result))
}

async function getCourseMember (ctx: Context) {
  const { course, role } = await loadCourseStateOrThrow(ctx)
  if (!role.manageCourse) {
    return ctx.throw(...ERR_PERM_DENIED)
  }

  const { userId } = ctx.params
  if (!userId) {
    return ctx.throw(...ERR_INVALID_ID)
  }

  const member = await courseService.getCourseMember(course._id, userId)
  if (!member) {
    return ctx.throw(...ERR_NOT_FOUND)
  }

  return createEnvelopedResponse(ctx, CourseMemberQueryResultSchema.encode(member))
}

async function updateCourseMember (ctx: Context) {
  const { course, role } = await loadCourseStateOrThrow(ctx)
  if (!role.manageCourse) {
    return ctx.throw(...ERR_PERM_DENIED)
  }

  const payload = CourseMemberUpdatePayloadSchema.safeParse(ctx.request.body)
  if (!payload.success) {
    return createZodErrorResponse(ctx, payload.error)
  }

  const { userId } = ctx.params
  if (!userId) {
    return ctx.throw(...ERR_INVALID_ID)
  }
  const user = await User.findOne({ uid: userId })
  if (!user) {
    return createErrorResponse(ctx, ErrorCode.NotFound, 'User not found')
  }
  const profile = await loadProfile(ctx)
  if (profile.uid === userId) {
    return createErrorResponse(ctx, ErrorCode.BadRequest, 'Cannot change your own role')
  }
  if (!payload.data.role.basic) {
    return createErrorResponse(ctx, ErrorCode.BadRequest, 'Basic permission is required, remove member if not needed')
  }

  const result = await courseService.updateCourseMember(
    course._id,
    user._id,
    payload.data.role,
  )
  ctx.auditLog.info(`<Course:${course.courseId}> member <User:${userId}> updated by <User:${profile.uid}>`)
  return createEnvelopedResponse(ctx, CourseMutationResultSchema.encode({ success: result }))
}

async function removeCourseMember (ctx: Context) {
  const { course, role } = await loadCourseStateOrThrow(ctx)
  if (!role.manageCourse) {
    return ctx.throw(...ERR_PERM_DENIED)
  }

  const { userId } = ctx.params
  if (!userId) {
    return ctx.throw(...ERR_INVALID_ID)
  }
  const profile = await loadProfile(ctx)
  if (profile.uid === userId) {
    return createErrorResponse(ctx, ErrorCode.BadRequest, 'Cannot remove yourself from the course')
  }

  const result = await courseService.removeCourseMember(course._id, userId)
  ctx.auditLog.info(`<Course:${course.courseId}> member <User:${userId}> removed by <User:${profile.uid}>`)
  return createEnvelopedResponse(ctx, CourseMutationResultSchema.encode({ success: result }))
}

async function addCourseProblems (ctx: Context) {
  const { course } = await loadCourseStateOrThrow(ctx)
  const payload = CourseProblemAddPayloadSchema.safeParse(ctx.request.body)
  if (!payload.success) {
    return createZodErrorResponse(ctx, payload.error)
  }

  const result = await Promise.all(payload.data.problemIds.map(async (pid) => {
    const problem = await problemService.getProblem(pid)
    if (!problem) {
      return false
    }
    return await courseService.addCourseProblem(course._id, problem._id)
  }))

  const successCount = result.filter(Boolean).length
  const profile = await loadProfile(ctx)
  ctx.auditLog.info(`<Course:${course.courseId}> added ${successCount} problems by <User:${profile.uid}>`)
  return createEnvelopedResponse(ctx, CourseProblemAddResultSchema.encode({
    success: successCount === payload.data.problemIds.length,
    added: successCount,
  }))
}

async function moveCourseProblem (ctx: Context) {
  const { course } = await loadCourseStateOrThrow(ctx)
  const payload = CourseProblemMovePayloadSchema.safeParse(ctx.request.body)
  if (!payload.success) {
    return createZodErrorResponse(ctx, payload.error)
  }

  const problem = await problemService.getProblem(ctx.params.problemId)
  if (!problem) {
    return ctx.throw(...ERR_INVALID_ID)
  }
  const result = await courseService.moveCourseProblem(
    course._id,
    problem._id,
    payload.data.beforePos,
  )
  return createEnvelopedResponse(ctx, CourseMutationResultSchema.encode({ success: result }))
}

async function rearrangeCourseProblem (ctx: Context) {
  const { course } = await loadCourseStateOrThrow(ctx)
  try {
    await courseService.rearrangeCourseProblem(course._id)
    return createEnvelopedResponse(ctx, CourseMutationResultSchema.encode({ success: true }))
  } catch (error: any) {
    return createErrorResponse(
      ctx,
      ErrorCode.InternalServerError,
      `Failed to rearrange course problems: ${error.message}`,
    )
  }
}

async function removeCourseProblem (ctx: Context) {
  const { course } = await loadCourseStateOrThrow(ctx)
  const problem = await problemService.getProblem(ctx.params.problemId)
  if (!problem) {
    return ctx.throw(...ERR_INVALID_ID)
  }
  const result = await courseService.removeCourseProblem(course._id, problem._id)
  const profile = await loadProfile(ctx)
  ctx.auditLog.info(`<Course:${course.courseId}> removed <Problem:${ctx.params.problemId}> by <User:${profile.uid}>`)
  return createEnvelopedResponse(ctx, CourseMutationResultSchema.encode({ success: result }))
}

function registerCourseHandlers (router: Router) {
  const courseRouter = new Router({ prefix: '/course' })

  courseRouter.get('/', findCourses)
  courseRouter.get('/items', loginRequire, findCourseItems)
  courseRouter.post('/', rootRequire, createCourse)
  courseRouter.get('/:courseId', loginRequire, getCourse)
  courseRouter.get('/:courseId/contests', loginRequire, findCourseContests)
  courseRouter.post('/:courseId', loginRequire, joinCourse)
  courseRouter.put('/:courseId', loginRequire, updateCourse)
  courseRouter.get('/:courseId/member', loginRequire, findCourseMembers)
  courseRouter.get('/:courseId/member/:userId', loginRequire, getCourseMember)
  courseRouter.post('/:courseId/member/:userId', loginRequire, updateCourseMember)
  courseRouter.delete('/:courseId/member/:userId', loginRequire, removeCourseMember)
  courseRouter.post('/:courseId/problem', adminRequire, addCourseProblems)
  courseRouter.put('/:courseId/problem/:problemId', adminRequire, moveCourseProblem)
  courseRouter.post('/:courseId/problem/rearrange', rootRequire, rearrangeCourseProblem)
  courseRouter.delete('/:courseId/problem/:problemId', adminRequire, removeCourseProblem)

  router.use(courseRouter.routes(), courseRouter.allowedMethods())
}

export default registerCourseHandlers
