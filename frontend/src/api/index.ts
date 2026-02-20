import type { WebsiteInformation } from '@backend/controllers/utils'
import type { CourseRole } from '@backend/types'
import type { CourseEntityEditable, CourseEntityItem, CourseEntityPreview, CourseEntityViewWithRole, CourseMemberView, ProblemEntityItem, SolutionEntity, TagEntity, TagEntityForm, TagEntityItem, TagEntityPreview, TagEntityView } from '@backend/types/entity'
import type { Enveloped, Paginated } from '@putongoj/shared'
import type { FindProblemsParams, FindProblemsResponse, PaginateParams } from '../types/api'
import type { TimeResp } from '@/types'
import { instance } from './instance'

export * from './instance'

const utils = {
  getWebsiteInformaton: () => instance.get<WebsiteInformation>('/website'),
  getTime: () => instance.get<TimeResp>('/servertime'),
  getRanklist: (params: { [key: string]: any }) =>
    instance.get('/ranklist/list', { params }),
}

const solution = {
  findOne: (data: { [key: string]: any }) =>
    instance.get(`/status/${data.sid}`, { params: data }),
  create: (data: { [key: string]: any }) =>
    instance.post<{ sid: number }>('/status', data),
  updateSolution: (solutionId: number, data: { judge: number }) =>
    instance.put<Enveloped<SolutionEntity>>(`/status/${solutionId}`, data),
}

const problem = {
  findOne: (params: { pid: number, [key: string]: any }) =>
    instance.get(`/problem/${params.pid}`, { params }),
  /** @deprecated */
  find: (data: { [key: string]: any }) =>
    instance.get('/problem', { params: data }),
  findProblems: (params: FindProblemsParams) =>
    instance.get<FindProblemsResponse>('/problem', { params }),
  findProblemItems: (params: { keyword: string, course?: number }) =>
    instance.get<ProblemEntityItem[]>('/problem/items', { params }),
  create: (data: { [key: string]: any }) =>
    instance.post('/problem/', data),
  update: (data: { [key: string]: any }) =>
    instance.put(`/problem/${data.pid}`, data),
  delete: (data: { [key: string]: any }) =>
    instance.delete(`/problem/${data.pid}`, data),
}

const news = {
  findOne: (data: { [key: string]: any }) =>
    instance.get(`/news/${data.nid}`, { params: data }),
  find: (data: { [key: string]: any }) =>
    instance.get('/news/list', { params: data }),
  create: (data: { [key: string]: any }) =>
    instance.post('/news/', data),
  update: (data: { [key: string]: any }) =>
    instance.put(`/news/${data.nid}`, data),
  delete: (data: { [key: string]: any }) =>
    instance.delete(`/news/${data.nid}`, data),
}

const tag = {
  findTags: () =>
    instance.get<TagEntityPreview[]>('/tag'),
  findTagItems: () =>
    instance.get<TagEntityItem[]>('/tag/items'),
  getTag: (tagId: number) =>
    instance.get<TagEntityView>(`/tag/${tagId}`),
  createTag: (tag: TagEntityForm) =>
    instance.post<Pick<TagEntity, 'tagId'>>('/tag', tag),
  updateTag: (tagId: number, tag: Partial<TagEntityForm>) =>
    instance.put<{ success: boolean }>(`/tag/${tagId}`, tag),
  removeTag: (tagId: number) =>
    instance.delete<{ success: boolean }>(`/tag/${tagId}`),
}

const discuss = {
  create: (data: { [key: string]: any }) =>
    instance.post('/discuss', data),
  find: (data: { [key: string]: any }) =>
    instance.get('/discuss/list', { params: data }),
  findOne: (data: { [key: string]: any }) =>
    instance.get(`/discuss/${data.did}`, { params: data }),
  update: (data: { [key: string]: any }) =>
    instance.put(`/discuss/${data.did}`, data),
  delete: (data: { [key: string]: any }) =>
    instance.delete(`/discuss/${data.did}`, data),
}

const course = {
  findCourses: (params: PaginateParams) =>
    instance.get<Paginated<CourseEntityPreview>>('/course', { params }),
  findCourseItems: (keyword: string) =>
    instance.get<CourseEntityItem[]>('/course/items', { params: { keyword } }),
  getCourse: (courseId: number) =>
    instance.get<CourseEntityViewWithRole>(`/course/${courseId}`),
  joinCourse: (courseId: number, joinCode: string) =>
    instance.post<{ success: boolean }>(`/course/${courseId}`, { joinCode }),
  createCourse: (course: CourseEntityEditable) =>
    instance.post<{ courseId: number }>('/course', course),
  updateCourse: (courseId: number, course: Partial<CourseEntityEditable>) =>
    instance.put(`/course/${courseId}`, course),
  findMembers: (courseId: number, params: PaginateParams) =>
    instance.get<Paginated<CourseMemberView>>(`/course/${courseId}/member`, { params }),
  getMember: (courseId: number, userId: string) =>
    instance.get<CourseMemberView>(`/course/${courseId}/member/${userId}`),
  updateMember: (courseId: number, userId: string, role: CourseRole) =>
    instance.post<{ success: boolean }>(`/course/${courseId}/member/${userId}`, { role }),
  removeMember: (courseId: number, userId: string) =>
    instance.delete<{ success: boolean }>(`/course/${courseId}/member/${userId}`),
  addProblems: (courseId: number, problemIds: number[]) =>
    instance.post<{ success: boolean, added: number }>(`/course/${courseId}/problem`, { problemIds }),
  moveCourseProblem: (courseId: number, problemId: number, beforePos: number) =>
    instance.put<{ success: boolean }>(`/course/${courseId}/problem/${problemId}`, { beforePos }),
  rearrangeProblems: (courseId: number) =>
    instance.post<{ success: boolean }>(`/course/${courseId}/problem/rearrange`),
  removeCourseProblem: (courseId: number, problemId: number) =>
    instance.delete<{ success: boolean }>(`/course/${courseId}/problem/${problemId}`),
}

export default {
  ...utils,
  solution,
  problem,
  news,
  tag,
  discuss,
  course,
}
