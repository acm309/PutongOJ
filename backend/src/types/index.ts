import type { contestLabelingStyle } from '../utils/constants'
import type { ErrorCode } from '../utils/error'

export * from './api'
export * from './enum'
export * from './model'

export interface CourseRole {
  basic: boolean
  viewTestcase: boolean
  viewSolution: boolean
  manageProblem: boolean
  manageContest: boolean
  manageCourse: boolean
}

export interface ContestOption {
  labelingStyle: typeof contestLabelingStyle[keyof typeof contestLabelingStyle]
}

export interface SessionProfile {
  uid: string
  privilege: number
  checksum: string
  verifyContest?: number[]
}

export interface PaginateOption {
  page: number
  pageSize: number
}

export interface SortOption {
  sort: 1 | -1
  sortBy: string
}

export interface Paginated<T> {
  docs: T[]
  limit: number
  page: number
  pages: number
  total: number
}

interface SuccessEnveloped<T = any> {
  success: true
  code: ErrorCode.OK
  message: string
  data: T
  requestId: string
}

interface ErrorEnveloped {
  success: false
  code: Exclude<ErrorCode, ErrorCode.OK>
  message: string
  data: null
  requestId: string
}

export type Enveloped<T = any> = SuccessEnveloped<T> | ErrorEnveloped
