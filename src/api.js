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
            duration: 10000
          })
        } else if (err.response && err.response.status === 403) {
          Vue.prototype.$Message.error({
            content: `╮(╯_╰)╭ 你没有相关权限进行此操作`,
            duration: 10000
          })
        } else if (err.response && err.response.status === 401) {
          Vue.prototype.$Message.error({
            content: `(〃∀〃) 请先登录`,
            duration: 10000
          })
        } else if (err.response && err.response.status === 400) {
          Vue.prototype.$Message.error({
            content: `${err.response.data.error}`,
            duration: 10000
          })
        } else if (!err.response) {
          Vue.prototype.$Message.error({
            content: `_(:з」∠)_  网络异常，检查你的网线`,
            duration: 10000
          })
        } else {
          Vue.prototype.$Message.error({
            content: err.message,
            duration: 10000
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
  // 用户注册
  register (data) {
    return instance.post('/user', data)
  },
  // 获取用户信息
  getUserInfo (data) {
    return instance.get(`/user/${data.uid}`, { params: data })
  },
  // 用户登录
  login (data) {
    return instance.post('/session', data)
  },
  // 获取提交列表
  getSolutions (data) {
    return instance.get('/status/list', { params: data })
  },
  // 获取一次提交
  findOneSolution (data) {
    return instance.get(`/status/${data.sid}`, { params: data })
  },
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
    delete: (data) => instance.delete(`/contest/${data.cid}`, data)
  },
  news: {
    findOne: (data) => instance.get(`/news/${data.pid}`, { params: data }),
    find: (data) => instance.get('/news/list', { params: data })
  }
}

export default api
