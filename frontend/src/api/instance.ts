import type { Enveloped } from '@putongoj/shared'
import type { AxiosRequestConfig, AxiosResponse } from 'axios'
import axios from 'axios'

// 设置全局axios默认值
axios.defaults.baseURL = '/api/'
axios.defaults.withCredentials = true
axios.defaults.timeout = 30000
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
  throw err
})

async function handleRequest<T> (request: Promise<AxiosResponse<Enveloped<T>>>): Promise<Enveloped<T>> {
  try {
    const resp = await request
    return resp.data
  } catch (err: any) {
    if (err.response) {
      const response = err.response
      return {
        success: false,
        code: response.status,
        message: `${response.status} ${response.statusText}`,
        data: null,
        requestId: 'N/A',
      }
    } else {
      return {
        success: false,
        code: -1,
        message: err.message || 'Network error',
        data: null,
        requestId: 'N/A',
      }
    }
  }
}

export const instanceSafe = {
  async get<T = any>(url: string, config?: AxiosRequestConfig) {
    return handleRequest<T>(instance.get<Enveloped<T>>(url, config))
  },
  async post<T = any>(url: string, data?: any, config?: AxiosRequestConfig) {
    return handleRequest<T>(instance.post<Enveloped<T>>(url, data, config))
  },
  async put<T = any>(url: string, data?: any, config?: AxiosRequestConfig) {
    return handleRequest<T>(instance.put<Enveloped<T>>(url, data, config))
  },
  async delete<T = any>(url: string, config?: AxiosRequestConfig) {
    return handleRequest<T>(instance.delete<Enveloped<T>>(url, config))
  },
}

export { instance }
export default instance
