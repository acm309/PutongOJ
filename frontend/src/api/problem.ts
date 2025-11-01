import type {
  ProblemSolutionListQuery,
  ProblemSolutionListQueryResult,
} from '@putongoj/shared'
import { instanceSafe as instance } from './instance'

export async function findSolutions (problemId: number, params: ProblemSolutionListQuery) {
  return instance.get<ProblemSolutionListQueryResult>(`/problem/${encodeURIComponent(problemId)}/solutions`, { params })
}
