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
} from '@putong-oj/shared'

import { apiClient } from './instance'

export async function findProblem (problemId: number, contestId?: number) {
  return apiClient.get<ProblemDetailQueryResult>(
    `/problem/${encodeURIComponent(problemId)}`,
    { params: contestId ? { cid: contestId } : undefined },
  )
}

export async function findProblems (params: ProblemListQuery) {
  return apiClient.get<ProblemListQueryResult>('/problem', { params })
}

export async function findProblemItems (params: ProblemItemListQuery) {
  return apiClient.get<ProblemItemListQueryResult>('/problem/items', { params })
}

export async function createProblem (payload: ProblemCreatePayload) {
  return apiClient.post<ProblemCreateResult>('/problem', payload)
}

export async function updateProblem (payload: ProblemUpdatePayload & { pid: number }) {
  const { pid, ...data } = payload
  return apiClient.put<ProblemUpdateResult>(`/problem/${encodeURIComponent(pid)}`, data)
}

export async function removeProblem (problemId: number) {
  return apiClient.delete<null>(`/problem/${encodeURIComponent(problemId)}`)
}

export async function findSolutions (problemId: number, params: ProblemSolutionListQuery) {
  return apiClient.get<ProblemSolutionListQueryResult>(`/problem/${encodeURIComponent(problemId)}/solutions`, { params })
}

export async function findTestcases (problemId: number) {
  return apiClient.get<ProblemTestcaseListQueryResult>(`/problem/${encodeURIComponent(problemId)}/testcases`)
}
export async function createTestcase (problemId: number, payload: ProblemTestcaseCreatePayload) {
  return apiClient.post<ProblemTestcaseListQueryResult>(`/problem/${encodeURIComponent(problemId)}/testcases`, payload)
}
export async function removeTestcase (problemId: number, uuid: string) {
  return apiClient.delete<ProblemTestcaseListQueryResult>(`/problem/${encodeURIComponent(problemId)}/testcases/${encodeURIComponent(uuid)}`)
}

export async function findProblemDiscussions (problemId: number, params: DiscussionListQuery) {
  return apiClient.get<DiscussionListQueryResult>(`/problem/${encodeURIComponent(problemId)}/discussions`, { params })
}

export async function getProblemStatistics (problemId: number) {
  return apiClient.get<ProblemStatisticsQueryResult>(`/problem/${encodeURIComponent(problemId)}/statistics`)
}
