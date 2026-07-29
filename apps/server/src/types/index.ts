import type { Types } from 'mongoose'
import type { CourseRole as SharedCourseRole } from '@putongoj/shared'

export type CourseRole = SharedCourseRole

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
