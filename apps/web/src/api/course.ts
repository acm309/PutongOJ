import type {
  CourseCreatePayload,
  CourseCreateResult,
  CourseDetailQueryResult,
  CourseItemListQuery,
  CourseItemListQueryResult,
  CourseListQuery,
  CourseListQueryResult,
  CourseMemberListQuery,
  CourseMemberListQueryResult,
  CourseMemberQueryResult,
  CourseMemberUpdatePayload,
  CourseMutationResult,
  CourseProblemAddPayload,
  CourseProblemAddResult,
  CourseProblemMovePayload,
} from '@putongoj/shared'
import { instanceSafe as instance } from './instance'

export async function findCourses (params: CourseListQuery) {
  return instance.get<CourseListQueryResult>('/courses', { params })
}

export async function findCourseItems (params: CourseItemListQuery) {
  return instance.get<CourseItemListQueryResult>('/courses/items', { params })
}

export async function getCourse (courseId: number) {
  return instance.get<CourseDetailQueryResult>(`/courses/${courseId}`)
}

export async function joinCourse (courseId: number, joinCode: string) {
  return instance.post<null>(`/courses/${courseId}/join`, { joinCode })
}

export async function createCourse (payload: CourseCreatePayload) {
  return instance.post<CourseCreateResult>('/courses', payload)
}

export async function updateCourse (courseId: number, payload: Partial<CourseCreatePayload> & { joinCode?: string }) {
  return instance.put<CourseMutationResult>(`/courses/${courseId}`, payload)
}

export async function findCourseMembers (courseId: number, params: CourseMemberListQuery) {
  return instance.get<CourseMemberListQueryResult>(`/courses/${courseId}/members`, { params })
}

export async function getCourseMember (courseId: number, userId: number) {
  return instance.get<CourseMemberQueryResult>(`/courses/${courseId}/members/${userId}`)
}

export async function updateCourseMember (courseId: number, userId: number, payload: CourseMemberUpdatePayload) {
  return instance.put<CourseMutationResult>(`/courses/${courseId}/members/${userId}`, payload)
}

export async function removeCourseMember (courseId: number, userId: number) {
  return instance.delete<CourseMutationResult>(`/courses/${courseId}/members/${userId}`)
}

export async function addCourseProblems (courseId: number, payload: CourseProblemAddPayload) {
  return instance.post<CourseProblemAddResult>(`/courses/${courseId}/problems`, payload)
}

export async function moveCourseProblem (courseId: number, problemId: number, payload: CourseProblemMovePayload) {
  return instance.put<CourseMutationResult>(`/courses/${courseId}/problems/${problemId}`, payload)
}

export async function rearrangeCourseProblems (courseId: number) {
  return instance.post<null>(`/courses/${courseId}/problems/rearrange`)
}

export async function removeCourseProblem (courseId: number, problemId: number) {
  return instance.delete<CourseMutationResult>(`/courses/${courseId}/problems/${problemId}`)
}
