import type {
  DiscussionListQuery,
  DiscussionListQueryResult,
  ProblemCreatePayload,
  ProblemCreateResult,
  ProblemDetailQueryResult,
  ProblemItemListQuery,
  ProblemItemListQueryResult,
  ProblemListQuery,
  ProblemListQueryResult,
  ProblemSolutionListQuery,
  ProblemSolutionListQueryResult,
  ProblemStatisticsQueryResult,
  ProblemTestcaseCreatePayload,
  ProblemTestcaseListQueryResult,
  ProblemUpdatePayload,
  ProblemUpdateResult,
} from '@putongoj/shared'

import { instanceSafe as instance } from './instance'

export async function findProblems (params: ProblemListQuery) {
  return instance.get<ProblemListQueryResult>('/problems', { params })
}

export async function findProblemItems (params: ProblemItemListQuery) {
  return instance.get<ProblemItemListQueryResult>('/problems/items', { params })
}

export async function getProblem (problemId: number) {
  return instance.get<ProblemDetailQueryResult>(`/problems/${problemId}`)
}

export async function createProblem (payload: ProblemCreatePayload) {
  return instance.post<ProblemCreateResult>('/problems', payload)
}

export async function updateProblem (problemId: number, payload: ProblemUpdatePayload) {
  return instance.put<ProblemUpdateResult>(`/problems/${problemId}`, payload)
}

export async function removeProblem (problemId: number) {
  return instance.delete<null>(`/problems/${problemId}`)
}

export async function findSolutions (problemId: number, params: ProblemSolutionListQuery) {
  return instance.get<ProblemSolutionListQueryResult>(`/problems/${problemId}/solutions`, { params })
}

export async function findTestcases (problemId: number) {
  return instance.get<ProblemTestcaseListQueryResult>(`/problems/${problemId}/testcases`)
}
export async function createTestcase (problemId: number, payload: ProblemTestcaseCreatePayload) {
  return instance.post<ProblemTestcaseListQueryResult>(`/problems/${problemId}/testcases`, payload)
}
export async function removeTestcase (problemId: number, uuid: string) {
  return instance.delete<ProblemTestcaseListQueryResult>(`/problems/${problemId}/testcases/${encodeURIComponent(uuid)}`)
}

export async function findProblemDiscussions (problemId: number, params: DiscussionListQuery) {
  return instance.get<DiscussionListQueryResult>(`/problems/${problemId}/discussions`, { params })
}

export async function getProblemStatistics (problemId: number) {
  return instance.get<ProblemStatisticsQueryResult>(`/problems/${problemId}/statistics`)
}
