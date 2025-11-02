import type {
  ProblemSolutionListQuery,
  ProblemSolutionListQueryResult,
  ProblemTestcaseCreatePayload,
  ProblemTestcaseListQueryResult,
} from '@putongoj/shared'

import { instanceSafe as instance } from './instance'

export async function findSolutions (problemId: number, params: ProblemSolutionListQuery) {
  return instance.get<ProblemSolutionListQueryResult>(`/problem/${encodeURIComponent(problemId)}/solutions`, { params })
}

export async function findTestcases (problemId: number) {
  return instance.get<ProblemTestcaseListQueryResult>(`/problem/${encodeURIComponent(problemId)}/testcases`)
}
export async function createTestcase (problemId: number, payload: ProblemTestcaseCreatePayload) {
  return instance.post<ProblemTestcaseListQueryResult>(`/problem/${encodeURIComponent(problemId)}/testcases`, payload)
}
export async function removeTestcase (problemId: number, uuid: string) {
  return instance.delete<ProblemTestcaseListQueryResult>(`/problem/${encodeURIComponent(problemId)}/testcases/${encodeURIComponent(uuid)}`)
}
