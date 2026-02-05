import type { Context } from 'koa'
import type { Types } from 'mongoose'
import type { CourseRole, WithId } from '../types'
import type { CourseEntity } from '../types/entity'
import Course from '../models/Course'
import courseService from '../services/course'
import { ERR_NOT_FOUND } from '../utils/error'

export interface CourseState {
  course: WithId<CourseEntity>
  role: CourseRole
}

async function _loadCourseState (ctx: Context, query: { _id: Types.ObjectId } | { courseId: number }) {
  const course = await Course.findOne(query).lean()
  if (!course) {
    return null
  }

  const profile = ctx.state.profile
  const role = await courseService.getUserRole(profile, course)
  const state: CourseState = { course, role }

  ctx.state.course = state
  return state
}

export async function loadCourseState (ctx: Context, inputId?: number | string) {
  const courseId = Number(inputId ?? ctx.params.courseId)
  if (!Number.isInteger(courseId) || courseId <= 0) {
    return null
  }
  if (ctx.state.course?.course.courseId === courseId) {
    return ctx.state.course
  }
  return await _loadCourseState(ctx, { courseId })
}

export async function loadCourseStateById (ctx: Context, objectId: Types.ObjectId | null) {
  if (!objectId) {
    return null
  }
  if (ctx.state.course?.course._id.equals(objectId)) {
    return ctx.state.course
  }
  return await _loadCourseState(ctx, { _id: objectId })
}

export async function loadCourseById (ctx: Context, objectId: Types.ObjectId | null) {
  const state = await loadCourseStateById(ctx, objectId)
  return state?.course ?? null
}

export async function loadCourseRoleById (ctx: Context, objectId: Types.ObjectId | null) {
  const state = await loadCourseStateById(ctx, objectId)
  return state?.role ?? null
}

/**
 * @deprecated Controller should handle error throwing
 */
export async function loadCourseStateOrThrow (ctx: Context, inputId?: number | string) {
  const state = await loadCourseState(ctx, inputId)
  if (!state) {
    ctx.throw(...ERR_NOT_FOUND)
  }
  return state
}
