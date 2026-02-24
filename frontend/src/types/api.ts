import type { Paginated, ProblemBrief } from '.'

export interface PaginateParams {
  page: number
  pageSize: number
}

export interface FindProblemsParams extends PaginateParams {
  type?: string
  content?: string
  course?: number
}

export interface FindProblemsResponse {
  list: Paginated<ProblemBrief>
  solved: number[]
}
