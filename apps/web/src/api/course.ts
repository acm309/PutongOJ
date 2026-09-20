import type {
  CourseCreatePayload,
  CourseCreateResult,
  CourseDetailQueryResult,
  CourseItemListQueryResult,
  CourseListQuery,
  CourseListQueryResult,
  CourseMemberListQuery,
  CourseMemberListQueryResult,
  CourseMemberQueryResult,
  CourseMemberUpdatePayload,
  CourseMutationResult,
  CourseProblemAddResult,
  CourseProblemMovePayload,
  CourseUpdatePayload,
} from '@putong-oj/shared'
import { apiClient } from './instance'

export async function findCourses (params: CourseListQuery) {
  return apiClient.get<CourseListQueryResult>('/course', { params })
}

export async function findCourseItems (keyword: string) {
  return apiClient.get<CourseItemListQueryResult>('/course/items', { params: { keyword } })
}

export async function getCourse (courseId: number) {
  return apiClient.get<CourseDetailQueryResult>(`/course/${encodeURIComponent(courseId)}`)
}

export async function joinCourse (courseId: number, joinCode: string) {
  return apiClient.post<CourseMutationResult>(`/course/${encodeURIComponent(courseId)}`, { joinCode })
}

export async function createCourse (payload: CourseCreatePayload) {
  return apiClient.post<CourseCreateResult>('/course', payload)
}

export async function updateCourse (courseId: number, payload: CourseUpdatePayload) {
  return apiClient.put<CourseMutationResult>(`/course/${encodeURIComponent(courseId)}`, payload)
}

export async function findCourseMembers (courseId: number, params: CourseMemberListQuery) {
  return apiClient.get<CourseMemberListQueryResult>(
    `/course/${encodeURIComponent(courseId)}/member`,
    { params },
  )
}

export async function getCourseMember (courseId: number, userId: string) {
  return apiClient.get<CourseMemberQueryResult>(
    `/course/${encodeURIComponent(courseId)}/member/${encodeURIComponent(userId)}`,
  )
}

export async function updateCourseMember (
  courseId: number,
  userId: string,
  payload: CourseMemberUpdatePayload,
) {
  return apiClient.post<CourseMutationResult>(
    `/course/${encodeURIComponent(courseId)}/member/${encodeURIComponent(userId)}`,
    payload,
  )
}

export async function removeCourseMember (courseId: number, userId: string) {
  return apiClient.delete<CourseMutationResult>(
    `/course/${encodeURIComponent(courseId)}/member/${encodeURIComponent(userId)}`,
  )
}

export async function addCourseProblems (courseId: number, problemIds: number[]) {
  return apiClient.post<CourseProblemAddResult>(
    `/course/${encodeURIComponent(courseId)}/problem`,
    { problemIds },
  )
}

export async function moveCourseProblem (
  courseId: number,
  problemId: number,
  payload: CourseProblemMovePayload,
) {
  return apiClient.put<CourseMutationResult>(
    `/course/${encodeURIComponent(courseId)}/problem/${encodeURIComponent(problemId)}`,
    payload,
  )
}

export async function rearrangeCourseProblems (courseId: number) {
  return apiClient.post<CourseMutationResult>(
    `/course/${encodeURIComponent(courseId)}/problem/rearrange`,
  )
}

export async function removeCourseProblem (courseId: number, problemId: number) {
  return apiClient.delete<CourseMutationResult>(
    `/course/${encodeURIComponent(courseId)}/problem/${encodeURIComponent(problemId)}`,
  )
}
