import type {
  ContestSolutionListExportQuery,
  ContestSolutionListExportQueryResult,
  ContestSolutionListQuery,
  ContestSolutionListQueryResult,
} from '@putongoj/shared'
import { instanceSafe as instance } from './instance'

export async function findSolutions (contestId: number, params: ContestSolutionListQuery) {
  return instance.get<ContestSolutionListQueryResult>(`/contest/${encodeURIComponent(contestId)}/solutions`, { params })
}
export async function exportSolutions (contestId: number, params: ContestSolutionListExportQuery) {
  return instance.get<ContestSolutionListExportQueryResult>(`/contest/${encodeURIComponent(contestId)}/solutions/export`, { params })
}
