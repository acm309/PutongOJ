import type { Context } from 'koa'
import Router from '@koa/router'
import { CourseVisibility } from '@putongoj/shared'
import { adminRequire, loadProfile, loginRequire, rootRequire } from '../middlewares/authn'
import { toCourseRole } from '../persistence/mappers'
import { loadCourseStateOrThrow } from '../policies/course'
import courseService from '../services/course'
import problemService from '../services/problem'
import userService from '../services/user'
import { parsePaginateOption, toObjectRecord } from '../utils'
import { ERR_INVALID_ID, ERR_NOT_FOUND, ERR_PERM_DENIED } from '../utils/constants'

function toCourseDto (
  course: { id: number, name: string, description: string, visibility: string, joinCode: string },
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
  const { page, pageSize } = parsePaginateOption(ctx.request.query, 5, 100)
  const result = await courseService.findCourses({ page, pageSize })
  ctx.body = { ...result, items: result.items.map(course => toCourseDto(course)) }
}

const findCourseItems = async (ctx: Context) => {
  const keyword = String(ctx.request.query.keyword ?? '').trim()
  ctx.body = await courseService.findCourseItems(keyword)
}

const getCourse = async (ctx: Context) => {
  const { course, role } = await loadCourseStateOrThrow(ctx)
  ctx.body = { ...toCourseDto(course, role), role: toCourseRole(role) }
}

const joinCourse = async (ctx: Context) => {
  const { course, role } = await loadCourseStateOrThrow(ctx)
  const profile = await loadProfile(ctx)
  const body = toObjectRecord(ctx.request.body)
  const joinCode = String(body.joinCode ?? '').trim()
  if (course.visibility === CourseVisibility.PRIVATE && (!joinCode || joinCode !== course.joinCode.trim())) {
    return ctx.throw(403, 'Invalid join code')
  }
  if (role.canAccess) {
    return ctx.body = { success: true }
  }
  ctx.body = { success: await courseService.joinCourse(course.id, profile.id) }
}

const createCourse = async (ctx: Context) => {
  const body = toObjectRecord(ctx.request.body)
  const profile = await loadProfile(ctx)
  const visibility = body.visibility === CourseVisibility.PUBLIC
    ? CourseVisibility.PUBLIC
    : CourseVisibility.PRIVATE
  const course = await courseService.createCourse({
    name: String(body.name ?? '').trim(),
    description: String(body.description ?? '').trim(),
    visibility,
    joinCode: '',
  })
  ctx.auditLog.info(`<Course:${course.id}> created by <User:${profile.username}>`)
  ctx.body = { id: course.id }
}

const updateCourse = async (ctx: Context) => {
  const { course, role } = await loadCourseStateOrThrow(ctx)
  if (!role.canManageCourse) {
    return ctx.throw(...ERR_PERM_DENIED)
  }
  const body = toObjectRecord(ctx.request.body)
  const profile = await loadProfile(ctx)
  const updated = await courseService.updateCourse(course.id, {
    name: String(body.name ?? '').trim(),
    description: String(body.description ?? '').trim(),
    visibility: body.visibility === CourseVisibility.PUBLIC
      ? CourseVisibility.PUBLIC
      : CourseVisibility.PRIVATE,
    joinCode: String(body.joinCode ?? '').trim(),
  })
  ctx.auditLog.info(`<Course:${course.id}> updated by <User:${profile.username}>`)
  ctx.body = { success: updated !== null }
}

const findCourseMembers = async (ctx: Context) => {
  const { course, role } = await loadCourseStateOrThrow(ctx)
  if (!role.canManageCourse) {
    return ctx.throw(...ERR_PERM_DENIED)
  }
  const { page, pageSize } = parsePaginateOption(ctx.request.query, 30, 200)
  const result = await courseService.findCourseMembers(course.id, { page, pageSize })
  ctx.body = result
}

const getCourseMember = async (ctx: Context) => {
  const { course, role } = await loadCourseStateOrThrow(ctx)
  if (!role.canManageCourse) {
    return ctx.throw(...ERR_PERM_DENIED)
  }
  const username = String(ctx.params.username ?? '')
  const member = await courseService.getCourseMember(course.id, username)
  if (!member) {
    return ctx.throw(...ERR_NOT_FOUND)
  }
  ctx.body = member
}

const updateCourseMember = async (ctx: Context) => {
  const { course, role } = await loadCourseStateOrThrow(ctx)
  if (!role.canManageCourse) {
    return ctx.throw(...ERR_PERM_DENIED)
  }
  const username = String(ctx.params.username ?? '')
  const values = toObjectRecord(ctx.request.body) as Record<string, boolean>
  const user = await userService.getUser(username)
  const profile = await loadProfile(ctx)
  if (!user) {
    return ctx.throw(404, 'User not found')
  }
  if (profile.id === user.id) {
    return ctx.throw(400, 'Cannot change your own role')
  }
  const fields = [
    'canAccess',
    'canViewTestcases',
    'canViewSubmissions',
    'canManageProblems',
    'canManageContests',
    'canManageCourse',
  ]
  if (fields.some(field => typeof values[field] !== 'boolean') || !values.canAccess) {
    return ctx.throw(400, 'Invalid course role')
  }
  const success = await courseService.updateCourseMember(course.id, user.id, {
    canAccess: values.canAccess,
    canViewTestcases: values.canViewTestcases,
    canViewSubmissions: values.canViewSubmissions,
    canManageProblems: values.canManageProblems,
    canManageContests: values.canManageContests,
    canManageCourse: values.canManageCourse,
  })
  ctx.auditLog.info(`<Course:${course.id}> member <User:${user.username}> updated by <User:${profile.username}>`)
  ctx.body = { success }
}

const removeCourseMember = async (ctx: Context) => {
  const { course, role } = await loadCourseStateOrThrow(ctx)
  if (!role.canManageCourse) {
    return ctx.throw(...ERR_PERM_DENIED)
  }
  const user = await userService.getUser(String(ctx.params.username ?? ''))
  const profile = await loadProfile(ctx)
  if (!user) {
    return ctx.throw(...ERR_NOT_FOUND)
  }
  if (profile.id === user.id) {
    return ctx.throw(400, 'Cannot remove yourself from the course')
  }
  ctx.body = { success: await courseService.removeCourseMember(course.id, user.id) }
}

const addCourseProblems = async (ctx: Context) => {
  const { course, role } = await loadCourseStateOrThrow(ctx)
  if (!role.canManageProblems) {
    return ctx.throw(...ERR_PERM_DENIED)
  }
  const problemIds = toObjectRecord(ctx.request.body).problemIds
  if (!Array.isArray(problemIds) || problemIds.length === 0) {
    return ctx.throw(400, 'problemIds must be a non-empty array')
  }
  const result = await Promise.all(problemIds.map(async (value) => {
    const problem = await problemService.getProblem(Number(value))
    return problem ? await courseService.addCourseProblem(course.id, problem.id) : false
  }))
  ctx.body = { success: result.every(Boolean), added: result.filter(Boolean).length }
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
  ctx.body = {
    success: await courseService.moveCourseProblem(
      course.id,
      problemId,
      Number(toObjectRecord(ctx.request.body).beforePosition ?? 1),
    ),
  }
}

const rearrangeCourseProblem = async (ctx: Context) => {
  const { course, role } = await loadCourseStateOrThrow(ctx)
  if (!role.canManageProblems) {
    return ctx.throw(...ERR_PERM_DENIED)
  }
  await courseService.rearrangeCourseProblems(course.id)
  ctx.body = { success: true }
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
  ctx.body = { success: await courseService.removeCourseProblem(course.id, problemId) }
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
  courseRouter.get('/:courseId/members/:username', loginRequire, getCourseMember)
  courseRouter.put('/:courseId/members/:username', loginRequire, updateCourseMember)
  courseRouter.delete('/:courseId/members/:username', loginRequire, removeCourseMember)
  courseRouter.post('/:courseId/problems', adminRequire, addCourseProblems)
  courseRouter.put('/:courseId/problems/:problemId', adminRequire, moveCourseProblem)
  courseRouter.post('/:courseId/problems/rearrange', rootRequire, rearrangeCourseProblem)
  courseRouter.delete('/:courseId/problems/:problemId', adminRequire, removeCourseProblem)
  router.use(courseRouter.routes(), courseRouter.allowedMethods())
}

export default registerCourseHandlers
