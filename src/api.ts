import axios from 'axios'
import urlJoin from 'url-join'
import { useSessionStore } from './store/modules/session'
import type { LoginParam, Profile, TimeResp, WebsiteConfigResp } from './types'

// 设置全局axios默认值
axios.defaults.baseURL = '/api/'
axios.defaults.withCredentials = true
axios.defaults.timeout = 100000 // 100000ms的超时验证
axios.defaults.headers.post['Content-Type'] = 'application/json;charset=UTF-8'
const instance = axios.create()

let errHandler: null | ((err: any) => void) = null
let isSemiRestful = false

export function setErrorHandler (handler: typeof errHandler) {
  errHandler = handler
}

instance.interceptors.request.use((config) => {
  if (!isSemiRestful) return config
  if (config.method === 'put') {
    config.method = 'post'
    config.url = urlJoin(config.url!, '/update')
  } else if (config.method === 'delete') {
    config.method = 'post'
    config.url = urlJoin(config.url!, '/delete')
  }
  return config
})

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
    window.alert('故障')
  }
  return err
})

const api = {
  // 获取题目提交图表信息
  getStatistics: (data: object) => instance.get(`/statistics/${data.pid}`, { params: data }),
  // 获取排名列表
  getRanklist: (data: object) => instance.get('/ranklist/list', { params: data }),
  // 图片上传
  getImage: (data: object) => instance.post('/submit', data),
  // 获取服务器时间
  getTime: () => instance.get<TimeResp>('/servertime'),
  getWebsiteConfig: () => instance.get<WebsiteConfigResp>('/website'),
  testcase: {
    findOne: (data: object) => instance.get(`/testcase/${data.pid}/${data.uuid}`, { params: data }),
    find: (data: object) => instance.get(`/testcase/${data.pid}`, { params: data }),
    create: (data: object) => instance.post(`/testcase/${data.pid}`, data),
    delete: (data: object) => instance.delete(`/testcase/${data.pid}/${data.uuid}`, data),
  },
  user: {
    findOne: (data: object) => instance.get(`/user/${data.uid}`, { params: data }),
    find: (data: object) => instance.get('/user/list', { params: data }),
    create: (data: object) => instance.post('/user', data),
    update: (data: object) => instance.put(`/user/${data.uid}`, data),
    delete: (data: object) => instance.delete(`/user/${data.uid}`, data),
  },
  solution: {
    findOne: (data: object) => instance.get(`/status/${data.sid}`, { params: data }),
    find: (data: object) => instance.get('/status/list', { params: data }),
    create: (data: object) => instance.post('/status', data),
  },
  problem: {
    findOne: (data: object) => instance.get(`/problem/${data.pid}`, { params: data }),
    find: (data: object) => instance.get('/problem/list', { params: data }),
    create: (data: object) => instance.post('/problem/', data),
    update: (data: object) => instance.put(`/problem/${data.pid}`, data),
    delete: (data: object) => instance.delete(`/problem/${data.pid}`, data),
  },
  contest: {
    findOne: (data: object) => instance.get(`/contest/${data.cid}`, { params: data }),
    find: (data: object) => instance.get('/contest/list', { params: data }),
    create: (data: object) => instance.post('/contest/', data),
    update: (data: object) => instance.put(`/contest/${data.cid}`, data),
    rank: (data: object) => instance.get(`/contest/${data.cid}/rank`, { params: data }),
    delete: (data: object) => instance.delete(`/contest/${data.cid}`, data),
    verify: (data: object) => instance.post(`/contest/${data.cid}/verify`, data),
  },
  news: {
    findOne: (data: object) => instance.get(`/news/${data.nid}`, { params: data }),
    find: (data: object) => instance.get('/news/list', { params: data }),
    create: (data: object) => instance.post('/news/', data),
    update: (data: object) => instance.put(`/news/${data.nid}`, data),
    delete: (data: object) => instance.delete(`/news/${data.nid}`, data),
  },
  group: {
    findOne: (data: object) => instance.get(`/group/${data.gid}`, { params: data }),
    find: (data: object) => instance.get('/group/list', { params: data }),
    create: (data: object) => instance.post('/group/', data),
    update: (data: object) => instance.put(`/group/${data.gid}`, data),
    delete: (data: object) => instance.delete(`/group/${data.gid}`, data),
  },
  tag: {
    findOne: (data: object) => instance.get(`/tag/${data.tid}`, { params: data }),
    find: (data: object) => instance.get('/tag/list', { params: data }),
    create: (data: object) => instance.post('/tag/', data),
    update: (data: object) => instance.put(`/tag/${data.tid}`, data),
    delete: (data: object) => instance.delete(`/tag/${data.tid}`, data),
  },
  session: {
    create: (data: LoginParam) => instance.post<{ profile: Profile }>('/session', data),
    delete: () => instance.delete<object>('/session'),
    fetch: () => instance.get<{ profile: Profile | null }>('/session'),
  },
  discuss: {
    create: (data: object) => instance.post('/discuss', data),
    find: (data: object) => instance.get('/discuss/list', { params: data }),
    findOne: (data: object) => instance.get(`/discuss/${data.did}`, { params: data }),
    update: (data: object) => instance.put(`/discuss/${data.did}`, data),
    delete: (data: object) => instance.delete(`/discuss/${data.did}`, data),
  },
}

export default {
  ...api,
  login: api.session.create,
  logout: api.session.delete,
  register: api.user.create,
}

export function semiRestful () {
  isSemiRestful = true
}
