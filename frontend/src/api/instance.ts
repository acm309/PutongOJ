import axios from 'axios'

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

instance.interceptors.response.use(resp => resp, (err) => {
  if (errHandler) {
    errHandler(err)
  } else {
    // eslint-disable-next-line no-alert
    window.alert('Cannot connect to server, '
      + 'please check your network connection or try again later.')
  }
  return err
})

export { instance }
export default instance
