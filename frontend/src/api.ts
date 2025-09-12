import type { CourseRole, Paginated } from '@backend/types'
import type { CourseEntityEditable, CourseEntityItem, CourseEntityPreview, CourseEntityViewWithRole, CourseMemberView, ProblemEntityItem, ProblemStatistics, TagEntity, TagEntityForm, TagEntityItem, TagEntityPreview, TagEntityView } from '@backend/types/entity'
import type { FindProblemsParams, FindProblemsResponse, PaginateParams, RanklistResponse } from './types/api'
import type { LoginParam, Profile, TimeResp, User, WebsiteConfigResp } from '@/types'
import axios from 'axios'
import { useSessionStore } from './store/modules/session'

// 设置全局axios默认值
axios.defaults.baseURL = '/api/'
axios.defaults.withCredentials = true
axios.defaults.timeout = 100000 // 100000ms的超时验证
axios.defaults.headers.post['Content-Type'] = 'application/json;charset=UTF-8'
const instance = axios.create()

let errHandler: null | ((err: any) => void) = null

export function setErrorHandler (handler: typeof errHandler) {
  errHandler = handler
}

instance.interceptors.response.use((resp) => {
  const data: { profile: Profile | null } = resp.data
  if (data.profile)
    useSessionStore().setLoginProfile(data.profile)
  return resp
}, (err) => {
  if (errHandler) {
    errHandler(err)
  } else {
    // eslint-disable-next-line no-alert
    window.alert('Cannot connect to server, '
      + 'please check your network connection or try again later.')
  }
  return err
})

const utils = {
  getWebsiteConfig: () => instance.get<WebsiteConfigResp>('/website'),
  getTime: () => instance.get<TimeResp>('/servertime'),
  getRanklist: (params: { [key: string]: any }) =>
    instance.get('/ranklist/list', { params }),
}

const testcase = {
  findOne: (data: { [key: string]: any }) =>
    instance.get(`/testcase/${data.pid}/${data.uuid}`, { params: data }),
  find: (data: { [key: string]: any }) =>
    instance.get(`/testcase/${data.pid}`, { params: data }),
  create: (data: { [key: string]: any }) =>
    instance.post(`/testcase/${data.pid}`, data),
  delete: (data: { [key: string]: any }) =>
    instance.delete(`/testcase/${data.pid}/${data.uuid}`, data),
}

const user = {
  findOne: (data: { [key: string]: any }) =>
    instance.get(`/user/${data.uid}`, { params: data }),
  find: (data: { [key: string]: any }) =>
    instance.get<Paginated<User>>('/user/list', { params: data }),
  create: (data: { [key: string]: any }) =>
    instance.post('/user', data),
  update: (data: { [key: string]: any }) =>
    instance.put(`/user/${data.uid}`, data),
  delete: (data: { [key: string]: any }) =>
    instance.delete(`/user/${data.uid}`, data),
}

const solution = {
  findOne: (data: { [key: string]: any }) =>
    instance.get(`/status/${data.sid}`, { params: data }),
  find: (data: { [key: string]: any }) =>
    instance.get('/status/list', { params: data }),
  create: (data: { [key: string]: any }) =>
    instance.post('/status', data),
}

const problem = {
  findOne: (params: { pid: number, [key: string]: any }) =>
    instance.get(`/problem/${params.pid}`, { params }),
  /** @deprecated */
  find: (data: { [key: string]: any }) =>
    instance.get('/problem', { params: data }),
  findProblems: (params: FindProblemsParams) =>
    instance.get<FindProblemsResponse>('/problem', { params }),
  findProblemItems: (keyword: string) =>
    instance.get<ProblemEntityItem[]>('/problem/items', { params: { keyword } }),
  create: (data: { [key: string]: any }) =>
    instance.post('/problem/', data),
  update: (data: { [key: string]: any }) =>
    instance.put(`/problem/${data.pid}`, data),
  delete: (data: { [key: string]: any }) =>
    instance.delete(`/problem/${data.pid}`, data),
  getStatistics: (pid: number, params: PaginateParams) =>
    instance.get<ProblemStatistics>(`/problem/${pid}/statistics`, { params }),
}

const contest = {
  findOne: (data: { [key: string]: any }) =>
    instance.get(`/contest/${data.cid}`, { params: data }),
  find: (data: { [key: string]: any }) =>
    instance.get('/contest/list', { params: data }),
  create: (data: { [key: string]: any }) =>
    instance.post('/contest/', data),
  update: (data: { [key: string]: any }) =>
    instance.put(`/contest/${data.cid}`, data),
  ranklist: (cid: number) =>
    instance.get<RanklistResponse>(`/contest/${cid}/ranklist`),
  delete: (data: { [key: string]: any }) =>
    instance.delete(`/contest/${data.cid}`, data),
  verify: (data: { [key: string]: any }) =>
    instance.post(`/contest/${data.cid}/verify`, data),
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

const group = {
  findOne: (data: { [key: string]: any }) =>
    instance.get(`/group/${data.gid}`, { params: data }),
  find: (data: { [key: string]: any }) =>
    instance.get('/group/list', { params: data }),
  create: (data: { [key: string]: any }) =>
    instance.post('/group/', data),
  update: (data: { [key: string]: any }) =>
    instance.put(`/group/${data.gid}`, data),
  delete: (data: { [key: string]: any }) =>
    instance.delete(`/group/${data.gid}`, data),
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

const session = {
  create: (data: LoginParam) =>
    instance.post<{ profile: Profile }>('/session', data),
  delete: () => instance.delete<object>('/session'),
  fetch: () => instance.get<{ profile: Profile | null }>('/session'),
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
}

export default {
  ...utils,
  login: session.create,
  logout: session.delete,
  register: user.create,
  testcase,
  user,
  solution,
  problem,
  contest,
  news,
  group,
  tag,
  discuss,
  session,
  course,
}
