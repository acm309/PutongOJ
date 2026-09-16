import type { ObjectId } from '@putong-oj/db'

export type { CourseRole } from '@putong-oj/shared'

export interface PaginateOption {
  page: number
  pageSize: number
}

export interface SortOption {
  sort: 1 | -1
  sortBy: string
}

export interface DocumentId {
  _id: ObjectId
}

export type WithId<T> = T & DocumentId
