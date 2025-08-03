import type { CourseRole, Paginated } from '@backend/types'
import type { CourseEntityEditable, CourseEntityItem, CourseEntityPreview, CourseEntityView, CourseMemberEntityView } from '@backend/types/entity'
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
  getStatistics: (params: { [key: string]: any }) =>
    instance.get(`/statistics/${params.pid}`, { params }),
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
  findOne: (data: { pid: number, [key: string]: any }) =>
    instance.get(`/problem/${data.pid}`),
  /** @deprecated */
  find: (data: { [key: string]: any }) =>
    instance.get('/problem', { params: data }),
  findProblems: (params: FindProblemsParams) =>
    instance.get<FindProblemsResponse>('/problem', { params }),
  create: (data: { [key: string]: any }) =>
    instance.post('/problem/', data),
  update: (data: { [key: string]: any }) =>
    instance.put(`/problem/${data.pid}`, data),
  delete: (data: { [key: string]: any }) =>
    instance.delete(`/problem/${data.pid}`, data),
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
  findOne: (data: { [key: string]: any }) =>
    instance.get(`/tag/${data.tid}`, { params: data }),
  find: (data: { [key: string]: any }) =>
    instance.get('/tag/list', { params: data }),
  create: (data: { [key: string]: any }) =>
    instance.post('/tag/', data),
  update: (data: { [key: string]: any }) =>
    instance.put(`/tag/${data.tid}`, data),
  delete: (data: { [key: string]: any }) =>
    instance.delete(`/tag/${data.tid}`, data),
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
    instance.get<CourseEntityView & { role: CourseRole }>(`/course/${courseId}`),
  createCourse: (course: CourseEntityEditable) =>
    instance.post<{ courseId: number }>('/course', course),
  updateCourse: (courseId: number, course: CourseEntityEditable) =>
    instance.put(`/course/${courseId}`, course),
  findMembers: (courseId: number, params: PaginateParams) =>
    instance.get<Paginated<CourseMemberEntityView>>(`/course/${courseId}/member`, { params }),
  getMember: (courseId: number, userId: string) =>
    instance.get<CourseMemberEntityView>(`/course/${courseId}/member/${userId}`),
  updateMember: (courseId: number, userId: string, role: CourseRole) =>
    instance.post<{ success: boolean }>(`/course/${courseId}/member/${userId}`, { role }),
  removeMember: (courseId: number, userId: string) =>
    instance.delete<{ success: boolean }>(`/course/${courseId}/member/${userId}`),
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
