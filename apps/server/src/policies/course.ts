import type { Types } from '@putong-oj/db'
import type { CourseEntity, WithId } from '@putong-oj/shared'
import type { Context } from 'koa'
import type { CourseRole } from '../types/index.ts'
import { Course } from '@putong-oj/db'
import { ObjectIdStringSchema } from '@putong-oj/shared'
import courseService from '../services/course.ts'
import { ERR_NOT_FOUND } from '../utils/constants.ts'

export interface CourseState {
  course: WithId<CourseEntity>
  role: CourseRole
}

async function _loadCourseState (ctx: Context, query: { _id: Types.ObjectId | string }) {
  const courseDocument = await Course.findOne(query)
  if (!courseDocument) {
    return null
  }

  const profile = ctx.state.profile
  const role = await courseService.getUserRole(profile, courseDocument)
  const course = courseDocument.toObject<WithId<CourseEntity>>({ virtuals: true })
  const state: CourseState = { course, role }

  ctx.state.course = state
  return state
}

export async function loadCourseState (ctx: Context, inputId?: string) {
  const courseId = ObjectIdStringSchema.safeParse(inputId ?? ctx.params.courseId)
  if (!courseId.success) {
    return null
  }
  if (ctx.state.course?.course.id === courseId.data) {
    return ctx.state.course
  }
  return await _loadCourseState(ctx, { _id: courseId.data })
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
export async function loadCourseStateOrThrow (ctx: Context, inputId?: string) {
  const state = await loadCourseState(ctx, inputId)
  if (!state) {
    ctx.throw(...ERR_NOT_FOUND)
  }
  return state
}
