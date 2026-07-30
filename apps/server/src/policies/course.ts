import type { CourseEntity, CourseRole } from '@putongoj/shared'
import type { Context } from 'koa'
import courseService from '../services/course'

export interface CourseState {
  course: CourseEntity
  role: CourseRole
}

async function buildCourseState (ctx: Context, courseId: number) {
  const course = await courseService.getCourse(courseId)
  if (!course) { return null }
  const role = await courseService.getUserRole(ctx.state.profile?.id, course)
  const state: CourseState = { course, role }
  ctx.state.course = state
  return state
}

export async function loadCourseState (ctx: Context, inputId?: number | string) {
  const courseId = Number(inputId ?? ctx.params.courseId)
  if (!Number.isInteger(courseId) || courseId <= 0) { return null }
  if (ctx.state.course?.course.id === courseId) { return ctx.state.course }
  return await buildCourseState(ctx, courseId)
}

export async function loadCourseStateById (ctx: Context, courseId: number | null) {
  if (courseId === null) { return null }
  if (ctx.state.course?.course.id === courseId) { return ctx.state.course }
  return await buildCourseState(ctx, courseId)
}

export async function loadCourseById (ctx: Context, courseId: number | null) {
  return (await loadCourseStateById(ctx, courseId))?.course ?? null
}

export async function loadCourseRoleById (ctx: Context, courseId: number | null) {
  return (await loadCourseStateById(ctx, courseId))?.role ?? null
}

export async function loadCourseStateOrThrow (ctx: Context, inputId?: number | string): Promise<CourseState> {
  const state = await loadCourseState(ctx, inputId)
  if (!state) { ctx.throw(404, 'Course not found') }
  return state
}
