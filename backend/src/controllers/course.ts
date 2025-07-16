import type { Context } from 'koa'
import type { CourseDocument } from '../models/Course'
import type { CourseRole, Paginated } from '../types'
import type { CourseEntity, CourseEntityLimited, CourseMemberEntity } from '../types/entity'
import courseServices from '../services/course'
import { parsePaginateOption } from '../utils'
import { ERR_INVALID_ID, ERR_NOT_FOUND, ERR_PERM_DENIED } from '../utils/error'

export async function loadCourse (
  ctx: Context,
  inputId?: string | number,
): Promise<{ course: CourseDocument, role: CourseRole }> {
  const courseId = Number(
    inputId || ctx.params.courseId || ctx.request.query.course,
  )
  if (!Number.isInteger(courseId) || courseId <= 0) {
    return ctx.throw(...ERR_INVALID_ID)
  }
  if (ctx.state.course?.courseId === courseId && ctx.state.courseRole) {
    return { course: ctx.state.course, role: ctx.state.courseRole }
  }

  const course = await courseServices.getCourse(courseId)
  if (!course) {
    return ctx.throw(...ERR_NOT_FOUND)
  }

  const { profile } = ctx.state
  const role = await courseServices.getUserRole(profile, course)

  ctx.state.course = course
  ctx.state.courseRole = role

  return { course, role }
}

const findCourses = async (ctx: Context) => {
  const opt = ctx.request.query
  const { page, pageSize } = parsePaginateOption(opt, 5, 100)

  const response: Paginated<CourseEntityLimited>
    = await courseServices.findCourses({ page, pageSize })
  ctx.body = response
}

const getCourse = async (ctx: Context) => {
  const { course, role } = await loadCourse(ctx)
  const { courseId, name, description, encrypt } = course

  const response: CourseEntityLimited & { role: CourseRole }
    = { courseId, name, description, encrypt, role }
  ctx.body = response
}

const createCourse = async (ctx: Context) => {
  const opt = ctx.request.body
  const { name, description, encrypt } = opt

  try {
    const course = await courseServices.createCourse({
      name, description, encrypt,
    })
    const response: Pick<CourseEntity, 'courseId'>
      = { courseId: course.courseId }
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

  const response: Paginated<CourseMemberEntity>
    = await courseServices.findCourseMembers(course.id, { page, pageSize })
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

  const member = await courseServices.getCourseMember(course.id, userId)
  if (!member) {
    return ctx.throw(...ERR_NOT_FOUND)
  }

  const response: CourseMemberEntity = member
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

  const result = await courseServices.updateCourseMember(
    course.id,
    userId,
    newRole as CourseRole,
  )

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

  const result = await courseServices.removeCourseMember(course.id, userId)

  const response: { success: boolean } = { success: result }
  ctx.body = response
}

const courseController = {
  loadCourse,
  findCourses,
  getCourse,
  createCourse,
  findCourseMembers,
  getCourseMember,
  updateCourseMember,
  removeCourseMember,
}

export default module.exports = courseController
