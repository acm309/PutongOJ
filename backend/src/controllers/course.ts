import type { Paginated } from '@putongoj/shared'
import type { Context } from 'koa'
import type { CourseDocument } from '../models/Course'
import type { CourseRole } from '../types'
import type { CourseEntity, CourseEntityItem, CourseEntityPreview, CourseEntityViewWithRole, CourseMemberView } from '../types/entity'
import { pick } from 'lodash'
import { Document } from 'mongoose'
import { loadProfile } from '../middlewares/authn'
import User from '../models/User'
import courseService from '../services/course'
import problemService from '../services/problem'
import { parsePaginateOption } from '../utils'
import { ERR_INVALID_ID, ERR_NOT_FOUND, ERR_PERM_DENIED } from '../utils/error'

export async function loadCourse (
  ctx: Context,
  input?: CourseDocument | string | number,
): Promise<{ course: CourseDocument, role: CourseRole }> {
  //
  const resolveCourse = async (): Promise<CourseDocument> => {
    if (input instanceof Document && (input as CourseDocument).courseId) {
      if (!ctx.state.course || ctx.state.course.courseId !== input.courseId) {
        ctx.state.courseRole = undefined
      }
      return input as CourseDocument
    }

    const courseId = Number(
      input ?? ctx.params.courseId ?? ctx.request.query.course,
    )
    if (!Number.isInteger(courseId) || courseId <= 0) {
      return ctx.throw(...ERR_INVALID_ID)
    }
    if (!ctx.state.course || ctx.state.course.courseId !== courseId) {
      ctx.state.courseRole = undefined
    }
    if (ctx.state.course?.courseId === courseId) {
      return ctx.state.course
    }

    const course = await courseService.getCourse(courseId)
    if (!course) {
      return ctx.throw(...ERR_NOT_FOUND)
    }
    return course
  }

  const resolveRole = async (course: CourseDocument): Promise<CourseRole> => {
    if (ctx.state.courseRole) {
      return ctx.state.courseRole
    }

    const { profile } = ctx.state
    return courseService.getUserRole(profile, course)
  }

  const course = await resolveCourse()
  const role = await resolveRole(course)

  ctx.state.course = course
  ctx.state.courseRole = role

  return { course, role }
}

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
  const { course, role } = await loadCourse(ctx)
  const response: CourseEntityViewWithRole = {
    ...pick(course, [
      'courseId', 'name', 'description', 'encrypt', 'canJoin',
    ]),
    joinCode: role.manageCourse ? course.joinCode : undefined,
    role,
  }

  ctx.body = response
}

const joinCourse = async (ctx: Context) => {
  const opt = ctx.request.body
  const { course, role } = await loadCourse(ctx)
  const joinCode = String(opt.joinCode ?? '').trim()
  if (!joinCode) {
    return ctx.throw(400, 'Missing join code')
  }
  if (course.joinCode.trim() !== joinCode) {
    return ctx.throw(403, 'Invalid join code')
  }

  const profile = await loadProfile(ctx)
  const result = await courseService.updateCourseMember(
    course.id, profile.id,
    { ...role, basic: true },
  )

  const response: { success: boolean } = { success: result }
  ctx.body = response
}

const createCourse = async (ctx: Context) => {
  const opt = ctx.request.body
  const profile = await loadProfile(ctx)
  try {
    const course = await courseService.createCourse(
      pick(opt, [ 'name', 'description', 'encrypt' ]))
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
  const { course, role } = await loadCourse(ctx)
  if (!role.manageCourse) {
    return ctx.throw(...ERR_PERM_DENIED)
  }

  const opt = ctx.request.body
  const { courseId } = course
  const profile = await loadProfile(ctx)
  try {
    const course = await courseService.updateCourse(courseId,
      pick(opt, [ 'name', 'description', 'encrypt', 'joinCode' ]))
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
  const { course, role } = await loadCourse(ctx)
  if (!role.manageCourse) {
    return ctx.throw(...ERR_PERM_DENIED)
  }

  const opt = ctx.request.query
  const { page, pageSize } = parsePaginateOption(opt, 30, 200)

  const response: Paginated<CourseMemberView>
    = await courseService.findCourseMembers(course.id, { page, pageSize })
  ctx.body = response
}

const getCourseMember = async (ctx: Context) => {
  const { course, role } = await loadCourse(ctx)
  if (!role.manageCourse) {
    return ctx.throw(...ERR_PERM_DENIED)
  }

  const { userId } = ctx.params
  if (!userId) {
    return ctx.throw(400, 'Missing uid')
  }

  const member = await courseService.getCourseMember(course.id, userId)
  if (!member) {
    return ctx.throw(...ERR_NOT_FOUND)
  }

  const response: CourseMemberView = member
  ctx.body = response
}

const updateCourseMember = async (ctx: Context) => {
  const { course, role } = await loadCourse(ctx)
  if (!role.manageCourse) {
    return ctx.throw(...ERR_PERM_DENIED)
  }

  const { userId } = ctx.params
  const { role: newRole } = ctx.request.body
  if (!userId || !newRole) {
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
    course.id,
    user.id,
    newRole as CourseRole,
  )
  ctx.auditLog.info(`<Course:${course.courseId}> member <User:${userId}> updated by <User:${profile.uid}>`)
  const response: { success: boolean } = { success: result }
  ctx.body = response
}

const removeCourseMember = async (ctx: Context) => {
  const { course, role } = await loadCourse(ctx)
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

  const result = await courseService.removeCourseMember(course.id, userId)
  const response: { success: boolean } = { success: result }
  ctx.auditLog.info(`<Course:${course.courseId}> member <User:${userId}> removed by <User:${profile.uid}>`)
  ctx.body = response
}

const addCourseProblems = async (ctx: Context) => {
  const { course } = await loadCourse(ctx)
  const { problemIds } = ctx.request.body
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
  const { course } = await loadCourse(ctx)
  const { beforePos = 1 } = ctx.request.body
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
  const { course } = await loadCourse(ctx)
  try {
    await courseService.rearrangeCourseProblem(course._id)
    ctx.body = { success: true }
  } catch (e: any) {
    ctx.throw(500, `Failed to rearrange course problems: ${e.message}`)
  }
}

const removeCourseProblem = async (ctx: Context) => {
  const { course } = await loadCourse(ctx)
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

const courseController = {
  loadCourse,
  findCourses,
  findCourseItems,
  getCourse,
  joinCourse,
  createCourse,
  updateCourse,
  findCourseMembers,
  getCourseMember,
  updateCourseMember,
  removeCourseMember,
  addCourseProblems,
  moveCourseProblem,
  rearrangeCourseProblem,
  removeCourseProblem,
} as const

export default courseController
