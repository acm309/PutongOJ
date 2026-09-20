import type { Enveloped, ErrorCode, ErrorEnveloped } from '@putong-oj/shared'
import type { AxiosRequestConfig, AxiosResponse } from 'axios'
import { ErrorCodeValues } from '@putong-oj/shared'
import axios from 'axios'

// 设置全局axios默认值
axios.defaults.baseURL = '/api/'
axios.defaults.withCredentials = true
axios.defaults.timeout = 30000
axios.defaults.headers.post['Content-Type'] = 'application/json;charset=UTF-8'
const instance = axios.create()

export type ApiErrorSource = 'application' | 'protocol' | 'transport'

export interface ApiError {
  source: ApiErrorSource
  code: ErrorCode | number
  message: string
  requestId: string
  status?: number
  fromEnvelope?: boolean
  cause?: unknown
}

export type CallerHandledCodes = readonly ErrorCode[] | 'all'

export interface ApiRequestConfig extends AxiosRequestConfig {
  callerHandledCodes?: CallerHandledCodes
}

export class ApiRequestError extends Error {
  readonly apiError: ApiError
  readonly envelope: ErrorEnveloped

  constructor (apiError: ApiError) {
    super(apiError.message)
    this.name = 'ApiRequestError'
    this.apiError = apiError
    this.envelope = {
      success: false,
      code: toEnvelopeCode(apiError.code),
      message: apiError.message,
      data: null,
      requestId: apiError.requestId,
    }
  }
}

function isEnveloped (value: unknown): value is Enveloped<unknown> {
  if (typeof value !== 'object' || value === null) {
    return false
  }

  const envelope = value as Partial<Enveloped<unknown>>
  return typeof envelope.success === 'boolean'
    && typeof envelope.code === 'number'
    && typeof envelope.message === 'string'
    && 'data' in envelope
    && typeof envelope.requestId === 'string'
}

function toEnvelopeCode (code: ErrorCode | number): ErrorCode | -1 {
  return ErrorCodeValues.includes(code) ? code as ErrorCode : -1
}

function createApplicationError (envelope: ErrorEnveloped): ApiError {
  return {
    source: 'application',
    code: envelope.code,
    message: envelope.message,
    requestId: envelope.requestId,
    fromEnvelope: true,
  }
}

function createProtocolError (message: string): ApiError {
  return {
    source: 'protocol',
    code: -1,
    message,
    requestId: 'N/A',
  }
}

function createTransportError (error: any): ApiError {
  const response = error?.response
  const envelope = response?.data

  if (isEnveloped(envelope) && !envelope.success) {
    return {
      source: 'transport',
      code: envelope.code,
      message: envelope.message,
      requestId: envelope.requestId,
      status: response.status,
      fromEnvelope: true,
      cause: error,
    }
  }

  const status = response?.status
  const message = status
    ? `${status} ${response.statusText || 'Request failed'}`
    : error?.message || 'Network error'

  return {
    source: 'transport',
    code: status ?? -1,
    message,
    requestId: 'N/A',
    status,
    cause: error,
  }
}

function shouldCallerHandle (
  error: ApiError,
  config?: ApiRequestConfig,
): boolean {
  if (error.source !== 'application' || config?.callerHandledCodes === undefined) {
    return false
  }
  if (config.callerHandledCodes === 'all') {
    return true
  }
  return config.callerHandledCodes.includes(error.code as ErrorCode)
}

let apiErrorHandler: null | ((error: ApiError) => void) = null

export function setApiErrorHandler (handler: (error: ApiError) => void) {
  apiErrorHandler = handler
}

function notifyApiError (error: ApiError) {
  if (apiErrorHandler) {
    apiErrorHandler(error)
  } else {
    // eslint-disable-next-line no-alert
    window.alert(error.message)
  }
}

instance.interceptors.response.use(
  (response) => {
    const { data, config } = response
    const requestConfig = config as ApiRequestConfig

    if (!isEnveloped(data)) {
      const error = createProtocolError('Invalid response envelope')
      notifyApiError(error)
      return Promise.reject(new ApiRequestError(error))
    }

    if (!data.success) {
      const error = createApplicationError(data)
      if (!shouldCallerHandle(error, requestConfig)) {
        notifyApiError(error)
      }
    }

    return response
  },
  (err) => {
    if (err instanceof ApiRequestError) {
      return Promise.reject(err)
    }

    const error = createTransportError(err)
    notifyApiError(error)
    return Promise.reject(new ApiRequestError(error))
  },
)

async function handleRequest<T> (
  request: Promise<AxiosResponse<Enveloped<T>>>,
): Promise<Enveloped<T>> {
  try {
    const resp = await request
    return resp.data
  } catch (err: any) {
    if (err instanceof ApiRequestError) {
      return err.envelope
    }

    const error = createTransportError(err)
    return new ApiRequestError(error).envelope
  }
}

export const apiClient = {
  async get<T = any>(
    url: string,
    config?: ApiRequestConfig,
  ) {
    return handleRequest<T>(instance.get<Enveloped<T>>(url, config))
  },
  async post<T = any>(
    url: string,
    data?: any,
    config?: ApiRequestConfig,
  ) {
    return handleRequest<T>(instance.post<Enveloped<T>>(url, data, config))
  },
  async put<T = any>(
    url: string,
    data?: any,
    config?: ApiRequestConfig,
  ) {
    return handleRequest<T>(instance.put<Enveloped<T>>(url, data, config))
  },
  async delete<T = any>(
    url: string,
    config?: ApiRequestConfig,
  ) {
    return handleRequest<T>(instance.delete<Enveloped<T>>(url, config))
  },
}

export { instance }
export default instance
