import type {
  DiscussionListQuery,
  DiscussionListQueryResult,
  ProblemSolutionListQuery,
  ProblemSolutionListQueryResult,
  ProblemStatisticsQueryResult,
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

export async function findProblemDiscussions (problemId: number, params: DiscussionListQuery) {
  return instance.get<DiscussionListQueryResult>(`/problem/${encodeURIComponent(problemId)}/discussions`, { params })
}

export async function getProblemStatistics (problemId: number) {
  return instance.get<ProblemStatisticsQueryResult>(`/problem/${encodeURIComponent(problemId)}/statistics`)
}
