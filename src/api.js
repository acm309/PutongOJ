import axios from 'axios'
import Vue from 'vue'

// 设置全局axios默认值
axios.defaults.timeout = 5000 // 5000ms的超时验证
axios.defaults.headers.post['Content-Type'] = 'application/json;charset=UTF-8'

const instance = {}

// 对异常的基本处理
;['get', 'post', 'put', 'delete'].forEach((key) => {
  instance[key] = function (...args) { // 闭包给原函数捕获异常
    return axios[key](...args)
      .catch((err) => {
        console.log(err)
        if (err.response && err.response.status >= 500) {
          Vue.prototype.$Message.error({
            content: `Σ(;ﾟдﾟ)  服务器崩坏，需要联系管理员维修`,
            duration: 6.5
          })
        } else if (err.response && err.response.status === 403) {
          Vue.prototype.$Message.error({
            content: `╮(╯_╰)╭ 你没有相关权限进行此操作`,
            duration: 6.5
          })
        } else if (err.response && err.response.status === 401) {
          Vue.prototype.$Message.error({
            content: `(〃∀〃) 请先登录`,
            duration: 6.5
          })
        } else if (err.response && err.response.status === 400) {
          Vue.prototype.$Message.error({
            content: `${err.response.data.error}`,
            duration: 6.5
          })
        } else if (!err.response) {
          Vue.prototype.$Message.error({
            content: `_(:з」∠)_  网络异常，检查你的网线`,
            duration: 6.5
          })
        } else {
          Vue.prototype.$Message.error({
            content: err.message,
            duration: 6.5
          })
        }
        return Promise.reject(new Error('I throw this on purpose'))
        // 继续抛出错误
        // 不让后面的继续执行，也就是说，后面的 then 必然是在请求没有错误的情况下才执行的
        // 因此后面不需要用 if (data.success) 语句判断是否有无错误
      })
  }
})

const api = {
  // 获取题目提交信息
  getStatistics (data) {
    return instance.get(`/statistics/${data.pid}`, { params: data })
  },
  // 获取排名列表
  getRanklist (data) {
    return instance.get('/ranklist/list', { params: data })
  },
  testdata: {
    create: (data) => instance.post('...', data) // TODO
  },
  user: {
    findOne: (data) => instance.get(`/user/${data.uid}`, { params: data }),
    find: (data) => instance.get('/user/list'),
    create: (data) => instance.post('/user', data),
    update: (data) => instance.put(`/user/${data.uid}`, data)
  },
  solution: {
    findOne: (data) => instance.get(`/status/${data.sid}`, { params: data }),
    find: (data) => instance.get('/status/list', { params: data }),
    create: (data) => instance.post('/status', data)
  },
  problem: {
    findOne: (data) => instance.get(`/problem/${data.pid}`, data),
    find: (data) => instance.get('/problem/list', { params: data }),
    create: (data) => instance.post('/problem/', data),
    update: (data) => instance.put(`/problem/${data.pid}`, data),
    delete: (data) => instance.delete(`/problem/${data.pid}`, data)
  },
  contest: {
    findOne: (data) => instance.get(`/contest/${data.cid}`, { params: data }),
    find: (data) => instance.get('/contest/list', { params: data }),
    create: (data) => instance.post('/contest/', data),
    update: (data) => instance.put(`/contest/${data.cid}`, data),
    rank: (data) => instance.get(`/contest/${data.cid}/rank`, { params: data }),
    delete: (data) => instance.delete(`/contest/${data.cid}`, data),
    verify: (data) => instance.post(`/contest/${data.cid}/verify`, data)
  },
  news: {
    findOne: (data) => instance.get(`/news/${data.nid}`, { params: data }),
    find: (data) => instance.get('/news/list', { params: data }),
    create: (data) => instance.post('/news/', data),
    update: (data) => instance.put(`/news/${data.nid}`, data),
    delete: (data) => instance.delete(`/news/${data.nid}`, data)
  },
  group: {
    findOne: (data) => instance.get(`/group/${data.gid}`, { params: data }),
    find: (data) => instance.get('/group/list', { params: data }),
    create: (data) => instance.post('/group/', data),
    update: (data) => instance.put(`/group/${data.gid}`, data),
    delete: (data) => instance.delete(`/group/${data.gid}`, data)
  },
  session: {
    create: (data) => instance.post('/session', data),
    delete: (data) => instance.delete('/session'),
    fetch: (data) => instance.get('/session')
  }
}

// alias
api.login = api.session.create
api.logout = api.session.delete
api.register = api.user.create

export default api
