import type { Types } from 'mongoose'

export interface CourseRole {
  basic: boolean
  viewTestcase: boolean
  viewSolution: boolean
  manageProblem: boolean
  manageContest: boolean
  manageCourse: boolean
}

export interface PaginateOption {
  page: number
  pageSize: number
}

export interface SortOption {
  sort: 1 | -1
  sortBy: string
}

export interface DocumentId {
  _id: Types.ObjectId
}

export type WithId<T> = T & DocumentId
