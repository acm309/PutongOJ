import type { CourseRole as SharedCourseRole } from '@putongoj/shared'

export type CourseRole = SharedCourseRole

export interface PaginateOption {
  page: number
  pageSize: number
}

export interface SortOption {
  sort: 'asc' | 'desc'
  sortBy: string
}
