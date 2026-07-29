import type { Paginated } from '@putongoj/shared'
import type { Context } from 'koa'
import type { CourseRole } from '../types'
import type { CourseEntity, CourseEntityItem, CourseEntityPreview, CourseEntityViewWithRole, CourseMemberView } from '../types/entity'
import Router from '@koa/router'
import { pick } from 'lodash'
import { adminRequire, loadProfile, loginRequire, rootRequire } from '../middlewares/authn'
import User from '../models/User'
import { loadCourseStateOrThrow } from '../policies/course'
import courseService from '../services/course'
import problemService from '../services/problem'
import { parsePaginateOption, toObjectRecord } from '../utils'
import { encrypt, ERR_INVALID_ID, ERR_NOT_FOUND, ERR_PERM_DENIED } from '../utils/constants'

const findCourses = async (ctx: Context) => {
  const opt = ctx.request.query
  const { page, pageSize } = parsePaginateOption(opt, 5, 100)

  const response: Paginated<CourseEntityPreview>
    = await courseService.findCourses({ page, pageSize })
  ctx.body = response
}

const findCourseItems = async (ctx: Context) => {
  const keyword = String(ctx.request.query.keyword ?? '').trim()
  const response: CourseEntityItem[]
    = await courseService.findCourseItems(keyword)
  ctx.body = response
}

const getCourse = async (ctx: Context) => {
  const { course, role } = await loadCourseStateOrThrow(ctx)
  const response: CourseEntityViewWithRole = {
    ...pick(course, [ 'courseId', 'name', 'description', 'encrypt' ]),
    joinCode: role.manageCourse ? course.joinCode : undefined,
    canJoin: (course.joinCode?.length ?? 0) > 0,
    role,
  }

  ctx.body = response
}

const joinCourse = async (ctx: Context) => {
  const opt = toObjectRecord(ctx.request.body)
  const { course, role } = await loadCourseStateOrThrow(ctx)
  const joinCode = String(opt.joinCode ?? '').trim()
  if (!joinCode) {
    return ctx.throw(400, 'Missing join code')
  }
  if (course.joinCode.trim() !== joinCode) {
    return ctx.throw(403, 'Invalid join code')
  }

  const profile = await loadProfile(ctx)
  const result = await courseService.updateCourseMember(
    course._id, profile._id,
    { ...role, basic: true },
  )

  const response: { success: boolean } = { success: result }
  ctx.body = response
}

const createCourse = async (ctx: Context) => {
  const opt = toObjectRecord(ctx.request.body)
  const profile = await loadProfile(ctx)
  try {
    const course = await courseService.createCourse({
      name: String(opt.name ?? '').trim(),
      description: String(opt.description ?? '').trim(),
      encrypt: Number(opt.encrypt) === encrypt.Public ? encrypt.Public : encrypt.Private,
    })
    const response: Pick<CourseEntity, 'courseId'>
      = { courseId: course.courseId }
    ctx.auditLog.info(`<Course:${course.courseId}> created by <User:${profile.uid}>`)
    ctx.body = response
  } catch (err: any) {
    if (err.name === 'ValidationError') {
      return ctx.throw(400, err.message)
    } else {
      throw err
    }
  }
}

const updateCourse = async (ctx: Context) => {
  const { course, role } = await loadCourseStateOrThrow(ctx)
  if (!role.manageCourse) {
    return ctx.throw(...ERR_PERM_DENIED)
  }

  const opt = toObjectRecord(ctx.request.body)
  const { courseId } = course
  const profile = await loadProfile(ctx)
  try {
    const course = await courseService.updateCourse(
      courseId,
      {
        name: String(opt.name ?? '').trim(),
        description: String(opt.description ?? '').trim(),
        encrypt: Number(opt.encrypt) === encrypt.Public ? encrypt.Public : encrypt.Private,
        joinCode: String(opt.joinCode ?? '').trim(),
      },
    )
    const response: { success: boolean } = { success: !!course }
    ctx.auditLog.info(`<Course:${courseId}> updated by <User:${profile.uid}>`)
    ctx.body = response
  } catch (err: any) {
    if (err.name === 'ValidationError') {
      return ctx.throw(400, err.message)
    } else {
      throw err
    }
  }
}

const findCourseMembers = async (ctx: Context) => {
  const { course, role } = await loadCourseStateOrThrow(ctx)
  if (!role.manageCourse) {
    return ctx.throw(...ERR_PERM_DENIED)
  }

  const opt = ctx.request.query
  const { page, pageSize } = parsePaginateOption(opt, 30, 200)

  const response: Paginated<CourseMemberView>
    = await courseService.findCourseMembers(course._id, { page, pageSize })
  ctx.body = response
}

const getCourseMember = async (ctx: Context) => {
  const { course, role } = await loadCourseStateOrThrow(ctx)
  if (!role.manageCourse) {
    return ctx.throw(...ERR_PERM_DENIED)
  }

  const { userId } = ctx.params
  if (!userId) {
    return ctx.throw(400, 'Missing uid')
  }

  const member = await courseService.getCourseMember(course._id, userId)
  if (!member) {
    return ctx.throw(...ERR_NOT_FOUND)
  }

  const response: CourseMemberView = member
  ctx.body = response
}

const updateCourseMember = async (ctx: Context) => {
  const { course, role } = await loadCourseStateOrThrow(ctx)
  if (!role.manageCourse) {
    return ctx.throw(...ERR_PERM_DENIED)
  }

  const { userId } = ctx.params
  const body = toObjectRecord(ctx.request.body)
  const hasRole = body.role != null
  const newRole = toObjectRecord(body.role) as Record<string, boolean>
  if (!userId || !hasRole) {
    return ctx.throw(400, 'Missing uid or role')
  }
  const user = await User.findOne({ uid: userId })
  if (!user) {
    return ctx.throw(404, 'User not found')
  }
  const profile = await loadProfile(ctx)
  if (profile.uid === userId) {
    return ctx.throw(400, 'Cannot change your own role')
  }

  const roleFields: Array<keyof CourseRole> = [
    'basic',
    'viewTestcase',
    'viewSolution',
    'manageProblem',
    'manageContest',
    'manageCourse',
  ]
  const invalidField = roleFields.find(field => typeof newRole[field] !== 'boolean')
  if (invalidField) {
    return ctx.throw(400, `Invalid role field: ${invalidField}`)
  }
  if (!newRole.basic) {
    return ctx.throw(400, 'Basic permission is required, remove member if not needed')
  }

  const result = await courseService.updateCourseMember(
    course._id,
    user._id,
    {
      basic: newRole.basic,
      viewTestcase: newRole.viewTestcase,
      viewSolution: newRole.viewSolution,
      manageProblem: newRole.manageProblem,
      manageContest: newRole.manageContest,
      manageCourse: newRole.manageCourse,
    },
  )
  ctx.auditLog.info(`<Course:${course.courseId}> member <User:${userId}> updated by <User:${profile.uid}>`)
  const response: { success: boolean } = { success: result }
  ctx.body = response
}

const removeCourseMember = async (ctx: Context) => {
  const { course, role } = await loadCourseStateOrThrow(ctx)
  if (!role.manageCourse) {
    return ctx.throw(...ERR_PERM_DENIED)
  }

  const { userId } = ctx.params
  if (!userId) {
    return ctx.throw(400, 'Missing uid')
  }
  const profile = await loadProfile(ctx)
  if (profile.uid === userId) {
    return ctx.throw(400, 'Cannot remove yourself from the course')
  }

  const result = await courseService.removeCourseMember(course._id, userId)
  const response: { success: boolean } = { success: result }
  ctx.auditLog.info(`<Course:${course.courseId}> member <User:${userId}> removed by <User:${profile.uid}>`)
  ctx.body = response
}

const addCourseProblems = async (ctx: Context) => {
  const { course } = await loadCourseStateOrThrow(ctx)
  const body = toObjectRecord(ctx.request.body)
  const problemIds = body.problemIds
  if (!Array.isArray(problemIds) || problemIds.length === 0) {
    return ctx.throw(400, 'problemIds must be a non-empty array')
  }

  const result = await Promise.all(problemIds.map(async (pid: any) => {
    const problem = await problemService.getProblem(pid)
    if (!problem) {
      return false
    }
    return await courseService.addCourseProblem(course._id, problem._id)
  }))

  const successCount = result.filter(v => v).length
  const response: { success: boolean, added: number } = {
    success: successCount === problemIds.length,
    added: successCount,
  }
  const profile = await loadProfile(ctx)
  ctx.auditLog.info(`<Course:${course.courseId}> added ${successCount} problems by <User:${profile.uid}>`)
  ctx.body = response
}

const moveCourseProblem = async (ctx: Context) => {
  const { course } = await loadCourseStateOrThrow(ctx)
  const body = toObjectRecord(ctx.request.body)
  const beforePos = Number(body.beforePos ?? 1)
  const problemId = ctx.params.problemId
  const problem = await problemService.getProblem(problemId)
  if (!problem) {
    return ctx.throw(...ERR_INVALID_ID)
  }
  const result = await courseService.moveCourseProblem(
    course._id, problem._id, beforePos,
  )
  ctx.body = { success: result }
}

const rearrangeCourseProblem = async (ctx: Context) => {
  const { course } = await loadCourseStateOrThrow(ctx)
  try {
    await courseService.rearrangeCourseProblem(course._id)
    ctx.body = { success: true }
  } catch (e: any) {
    ctx.throw(500, `Failed to rearrange course problems: ${e.message}`)
  }
}

const removeCourseProblem = async (ctx: Context) => {
  const { course } = await loadCourseStateOrThrow(ctx)
  const problemId = ctx.params.problemId
  const problem = await problemService.getProblem(problemId)
  if (!problem) {
    return ctx.throw(...ERR_INVALID_ID)
  }
  const result = await courseService.removeCourseProblem(course._id, problem._id)
  const profile = await loadProfile(ctx)
  ctx.auditLog.info(`<Course:${course.courseId}> removed <Problem:${problemId}> by <User:${profile.uid}>`)
  ctx.body = { success: result }
}

function registerCourseHandlers (router: Router) {
  const courseRouter = new Router({ prefix: '/course' })

  courseRouter.get('/', findCourses)
  courseRouter.get('/items', loginRequire, findCourseItems)
  courseRouter.post('/', rootRequire, createCourse)
  courseRouter.get('/:courseId', loginRequire, getCourse)
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
