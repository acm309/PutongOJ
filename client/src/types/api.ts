import type { Paginated, ProblemBrief, RanklistInfo, RawRanklist } from '.'

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

export interface RanklistResponse {
  ranklist: RawRanklist
  info: RanklistInfo
}
