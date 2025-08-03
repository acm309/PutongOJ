import type { Context } from 'koa'
import type { CourseDocument } from '../models/Course'
import type { CourseRole, Paginated } from '../types'
import type { CourseEntity, CourseEntityItem, CourseEntityPreview, CourseEntityViewWithRole, CourseMemberEntityView } from '../types/entity'
import { pick } from 'lodash'
import { Document } from 'mongoose'
import { loadProfile } from '../middlewares/authn'
import courseService from '../services/course'
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
  const { courseId, name, description, encrypt } = course

  const response: CourseEntityViewWithRole
    = { courseId, name, description, encrypt, role }
  ctx.body = response
}

const createCourse = async (ctx: Context) => {
  const opt = ctx.request.body
  try {
    const course = await courseService.createCourse(
      pick(opt, [ 'name', 'description', 'encrypt' ]))
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

const updateCourse = async (ctx: Context) => {
  const { course, role } = await loadCourse(ctx)
  if (!role.manageCourse) {
    return ctx.throw(...ERR_PERM_DENIED)
  }

  const opt = ctx.request.body
  const { courseId } = course
  try {
    const course = await courseService.updateCourse(courseId,
      pick(opt, [ 'name', 'description', 'encrypt' ]))
    const response: { success: boolean } = { success: !!course }
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

  const response: Paginated<CourseMemberEntityView>
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

  const response: CourseMemberEntityView = member
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
  const profile = await loadProfile(ctx)
  if (profile.uid === userId) {
    return ctx.throw(400, 'Cannot remove yourself from the course')
  }

  const result = await courseService.removeCourseMember(course.id, userId)
  const response: { success: boolean } = { success: result }
  ctx.body = response
}

const courseController = {
  loadCourse,
  findCourses,
  findCourseItems,
  getCourse,
  createCourse,
  updateCourse,
  findCourseMembers,
  getCourseMember,
  updateCourseMember,
  removeCourseMember,
}

export default module.exports = courseController
