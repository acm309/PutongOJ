import type { CourseVisibility as DbCourseVisibility } from '@putongoj/db'
import type { Context } from 'koa'
import Router from '@koa/router'
import {
  CourseCreatePayloadSchema,
  CourseCreateResultSchema,
  CourseDetailQueryResultSchema,
  CourseItemListQueryResultSchema,
  CourseItemListQuerySchema,
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
  CourseVisibility,
} from '@putongoj/shared'
import { adminRequire, loadProfile, loginRequire, rootRequire } from '../middlewares/authn'
import { loadCourseStateOrThrow } from '../policies/course'
import courseService from '../services/course'
import problemService from '../services/problem'
import userService from '../services/user'
import { createEnvelopedResponse, createZodErrorResponse } from '../utils'
import { ERR_INVALID_ID, ERR_NOT_FOUND, ERR_PERM_DENIED } from '../utils/constants'

function toCourseDto (
  course: { id: number, name: string, description: string, visibility: DbCourseVisibility, joinCode: string },
  role?: { canManageCourse: boolean },
) {
  return {
    id: course.id,
    name: course.name,
    description: course.description,
    visibility: course.visibility,
    ...(role?.canManageCourse ? { joinCode: course.joinCode } : {}),
    canJoin: course.visibility === CourseVisibility.PUBLIC || course.joinCode.length > 0,
  }
}

const findCourses = async (ctx: Context) => {
  const query = CourseListQuerySchema.safeParse(ctx.request.query)
  if (!query.success) {
    return createZodErrorResponse(ctx, query.error)
  }
  const result = await courseService.findCourses(query.data)
  return createEnvelopedResponse(ctx, CourseListQueryResultSchema.encode({
    ...result,
    items: result.items.map(course => toCourseDto(course)),
  }))
}

const findCourseItems = async (ctx: Context) => {
  const query = CourseItemListQuerySchema.safeParse(ctx.request.query)
  if (!query.success) {
    return createZodErrorResponse(ctx, query.error)
  }
  const result = await courseService.findCourseItems(query.data.keyword.trim())
  return createEnvelopedResponse(ctx, CourseItemListQueryResultSchema.encode(result))
}

const getCourse = async (ctx: Context) => {
  const { course, role } = await loadCourseStateOrThrow(ctx)
  return createEnvelopedResponse(ctx, CourseDetailQueryResultSchema.encode({
    ...toCourseDto(course, role),
    role,
  }))
}

const joinCourse = async (ctx: Context) => {
  const { course, role } = await loadCourseStateOrThrow(ctx)
  const profile = await loadProfile(ctx)
  const joinCode = typeof ctx.request.body === 'object' && ctx.request.body !== null
    && 'joinCode' in ctx.request.body && typeof ctx.request.body.joinCode === 'string'
    ? ctx.request.body.joinCode.trim()
    : ''
  if (course.visibility === CourseVisibility.PRIVATE && (!joinCode || joinCode !== course.joinCode.trim())) {
    return ctx.throw(403, 'Invalid join code')
  }
  if (role.canAccess) {
    return createEnvelopedResponse(ctx, null)
  }
  await courseService.joinCourse(course.id, profile.id)
  return createEnvelopedResponse(ctx, null)
}

const createCourse = async (ctx: Context) => {
  const payload = CourseCreatePayloadSchema.safeParse(ctx.request.body)
  if (!payload.success) {
    return createZodErrorResponse(ctx, payload.error)
  }
  const profile = await loadProfile(ctx)
  const course = await courseService.createCourse({
    ...payload.data,
    joinCode: '',
  })
  ctx.auditLog.info(`<Course:${course.id}> created by <User:${profile.username}>`)
  return createEnvelopedResponse(ctx, CourseCreateResultSchema.encode({ id: course.id }))
}

const updateCourse = async (ctx: Context) => {
  const { course, role } = await loadCourseStateOrThrow(ctx)
  if (!role.canManageCourse) {
    return ctx.throw(...ERR_PERM_DENIED)
  }
  const payload = CourseUpdatePayloadSchema.safeParse(ctx.request.body)
  if (!payload.success) {
    return createZodErrorResponse(ctx, payload.error)
  }
  const profile = await loadProfile(ctx)
  const updated = await courseService.updateCourse(course.id, payload.data)
  ctx.auditLog.info(`<Course:${course.id}> updated by <User:${profile.username}>`)
  return createEnvelopedResponse(ctx, CourseMutationResultSchema.encode({
    success: updated !== null,
  }))
}

const findCourseMembers = async (ctx: Context) => {
  const { course, role } = await loadCourseStateOrThrow(ctx)
  if (!role.canManageCourse) {
    return ctx.throw(...ERR_PERM_DENIED)
  }
  const query = CourseMemberListQuerySchema.safeParse(ctx.request.query)
  if (!query.success) {
    return createZodErrorResponse(ctx, query.error)
  }
  const result = await courseService.findCourseMembers(course.id, query.data)
  return createEnvelopedResponse(ctx, CourseMemberListQueryResultSchema.encode(result))
}

const getCourseMember = async (ctx: Context) => {
  const { course, role } = await loadCourseStateOrThrow(ctx)
  if (!role.canManageCourse) {
    return ctx.throw(...ERR_PERM_DENIED)
  }
  const userId = Number(ctx.params.userId)
  if (!Number.isInteger(userId) || userId <= 0) {
    return ctx.throw(...ERR_INVALID_ID)
  }
  const member = await courseService.getCourseMember(course.id, userId)
  if (!member) {
    return ctx.throw(...ERR_NOT_FOUND)
  }
  return createEnvelopedResponse(ctx, CourseMemberQueryResultSchema.encode(member))
}

const updateCourseMember = async (ctx: Context) => {
  const { course, role } = await loadCourseStateOrThrow(ctx)
  if (!role.canManageCourse) {
    return ctx.throw(...ERR_PERM_DENIED)
  }
  const payload = CourseMemberUpdatePayloadSchema.safeParse(ctx.request.body)
  if (!payload.success) {
    return createZodErrorResponse(ctx, payload.error)
  }
  const userId = Number(ctx.params.userId)
  if (!Number.isInteger(userId) || userId <= 0) {
    return ctx.throw(...ERR_INVALID_ID)
  }
  const user = await userService.getUserById(userId)
  const profile = await loadProfile(ctx)
  if (!user) {
    return ctx.throw(404, 'User not found')
  }
  if (profile.id === user.id) {
    return ctx.throw(400, 'Cannot change your own role')
  }
  if (!payload.data.canAccess) {
    return ctx.throw(400, 'Invalid course role')
  }
  const success = await courseService.updateCourseMember(course.id, user.id, payload.data)
  ctx.auditLog.info(`<Course:${course.id}> member <User:${user.username}> updated by <User:${profile.username}>`)
  return createEnvelopedResponse(ctx, CourseMutationResultSchema.encode({ success }))
}

const removeCourseMember = async (ctx: Context) => {
  const { course, role } = await loadCourseStateOrThrow(ctx)
  if (!role.canManageCourse) {
    return ctx.throw(...ERR_PERM_DENIED)
  }
  const userId = Number(ctx.params.userId)
  if (!Number.isInteger(userId) || userId <= 0) {
    return ctx.throw(...ERR_INVALID_ID)
  }
  const user = await userService.getUserById(userId)
  const profile = await loadProfile(ctx)
  if (!user) {
    return ctx.throw(...ERR_NOT_FOUND)
  }
  if (profile.id === user.id) {
    return ctx.throw(400, 'Cannot remove yourself from the course')
  }
  return createEnvelopedResponse(ctx, CourseMutationResultSchema.encode({
    success: await courseService.removeCourseMember(course.id, user.id),
  }))
}

const addCourseProblems = async (ctx: Context) => {
  const { course, role } = await loadCourseStateOrThrow(ctx)
  if (!role.canManageProblems) {
    return ctx.throw(...ERR_PERM_DENIED)
  }
  const payload = CourseProblemAddPayloadSchema.safeParse(ctx.request.body)
  if (!payload.success) {
    return createZodErrorResponse(ctx, payload.error)
  }
  const result = await Promise.all(payload.data.problemIds.map(async (problemId) => {
    const problem = await problemService.getProblem(problemId)
    return problem ? await courseService.addCourseProblem(course.id, problem.id) : false
  }))
  return createEnvelopedResponse(ctx, CourseProblemAddResultSchema.encode({
    added: result.filter(Boolean).length,
  }))
}

const moveCourseProblem = async (ctx: Context) => {
  const { course, role } = await loadCourseStateOrThrow(ctx)
  if (!role.canManageProblems) {
    return ctx.throw(...ERR_PERM_DENIED)
  }
  const problemId = Number(ctx.params.problemId)
  if (!Number.isInteger(problemId)) {
    return ctx.throw(...ERR_INVALID_ID)
  }
  const payload = CourseProblemMovePayloadSchema.safeParse(ctx.request.body)
  if (!payload.success) {
    return createZodErrorResponse(ctx, payload.error)
  }
  return createEnvelopedResponse(ctx, CourseMutationResultSchema.encode({
    success: await courseService.moveCourseProblem(course.id, problemId, payload.data.beforePosition),
  }))
}

const rearrangeCourseProblem = async (ctx: Context) => {
  const { course, role } = await loadCourseStateOrThrow(ctx)
  if (!role.canManageProblems) {
    return ctx.throw(...ERR_PERM_DENIED)
  }
  await courseService.rearrangeCourseProblems(course.id)
  return createEnvelopedResponse(ctx, null)
}

const removeCourseProblem = async (ctx: Context) => {
  const { course, role } = await loadCourseStateOrThrow(ctx)
  if (!role.canManageProblems) {
    return ctx.throw(...ERR_PERM_DENIED)
  }
  const problemId = Number(ctx.params.problemId)
  if (!Number.isInteger(problemId)) {
    return ctx.throw(...ERR_INVALID_ID)
  }
  return createEnvelopedResponse(ctx, CourseMutationResultSchema.encode({
    success: await courseService.removeCourseProblem(course.id, problemId),
  }))
}

function registerCourseHandlers (router: Router) {
  const courseRouter = new Router({ prefix: '/courses' })
  courseRouter.get('/', findCourses)
  courseRouter.get('/items', loginRequire, findCourseItems)
  courseRouter.post('/', rootRequire, createCourse)
  courseRouter.get('/:courseId', loginRequire, getCourse)
  courseRouter.post('/:courseId/join', loginRequire, joinCourse)
  courseRouter.put('/:courseId', loginRequire, updateCourse)
  courseRouter.get('/:courseId/members', loginRequire, findCourseMembers)
  courseRouter.get('/:courseId/members/:userId', loginRequire, getCourseMember)
  courseRouter.put('/:courseId/members/:userId', loginRequire, updateCourseMember)
  courseRouter.delete('/:courseId/members/:userId', loginRequire, removeCourseMember)
  courseRouter.post('/:courseId/problems', adminRequire, addCourseProblems)
  courseRouter.put('/:courseId/problems/:problemId', adminRequire, moveCourseProblem)
  courseRouter.post('/:courseId/problems/rearrange', rootRequire, rearrangeCourseProblem)
  courseRouter.delete('/:courseId/problems/:problemId', adminRequire, removeCourseProblem)
  router.use(courseRouter.routes(), courseRouter.allowedMethods())
}

export default registerCourseHandlers
