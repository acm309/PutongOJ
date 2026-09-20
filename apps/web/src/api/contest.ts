import type {
  ContestConfigEditPayload,
  ContestConfigQueryResult,
  ContestCreatePayload,
  ContestDetailQueryResult,
  ContestListQuery,
  ContestListQueryResult,
  ContestParticipantListQuery,
  ContestParticipantListQueryResult,
  ContestParticipantUpdatePayload,
  ContestParticipatePayload,
  ContestParticipationQueryResult,
  ContestRanklistQueryResult,
  ContestSolutionListExportQuery,
  ContestSolutionListExportQueryResult,
  ContestSolutionListQuery,
  ContestSolutionListQueryResult,
  CourseContestListQuery,
  DiscussionListQuery,
  DiscussionListQueryResult,
} from '@putong-oj/shared'

import { apiClient } from './instance'

export async function findContests (params: ContestListQuery) {
  return apiClient.get<ContestListQueryResult>('/contests', { params })
}

export async function findCourseContests (courseId: number | string, params: CourseContestListQuery) {
  return apiClient.get<ContestListQueryResult>(`/course/${encodeURIComponent(courseId)}/contests`, { params })
}

export async function createContest (payload: ContestCreatePayload) {
  return apiClient.post<{ contestId: number }>('/contests', payload)
}
export async function getContest (contestId: number) {
  return apiClient.get<ContestDetailQueryResult>(`/contests/${encodeURIComponent(contestId)}`)
}

export async function getContestRanklist (contestId: number) {
  return apiClient.get<ContestRanklistQueryResult>(`/contests/${encodeURIComponent(contestId)}/ranklist`)
}

export async function getParticipation (contestId: number) {
  return apiClient.get<ContestParticipationQueryResult>(`/contests/${encodeURIComponent(contestId)}/participation`)
}
export async function participateContest (contestId: number, payload: ContestParticipatePayload) {
  return apiClient.post<null>(`/contests/${encodeURIComponent(contestId)}/participation`, payload)
}
export async function earlyExit (contestId: number) {
  return apiClient.put<null>(`/contests/${encodeURIComponent(contestId)}/participation/early-exit`, {})
}
export async function findParticipants (contestId: number, params: ContestParticipantListQuery) {
  return apiClient.get<ContestParticipantListQueryResult>(`/contests/${encodeURIComponent(contestId)}/participants`, { params })
}
export async function updateParticipantStatus (contestId: number, username: string, payload: ContestParticipantUpdatePayload) {
  return apiClient.put<null>(`/contests/${encodeURIComponent(contestId)}/participants/${encodeURIComponent(username)}`, payload)
}

export async function getConfig (contestId: number) {
  return apiClient.get<ContestConfigQueryResult>(`/contests/${encodeURIComponent(contestId)}/configs`)
}
export async function updateConfig (contestId: number, config: ContestConfigEditPayload) {
  return apiClient.put<null>(`/contests/${encodeURIComponent(contestId)}/configs`, config)
}

export async function findSolutions (contestId: number, params: ContestSolutionListQuery) {
  return apiClient.get<ContestSolutionListQueryResult>(`/contests/${encodeURIComponent(contestId)}/solutions`, { params })
}
export async function exportSolutions (contestId: number, params: ContestSolutionListExportQuery) {
  return apiClient.get<ContestSolutionListExportQueryResult>(`/contests/${encodeURIComponent(contestId)}/solutions/export`, { params })
}

export async function findContestDiscussions (contestId: number, params: DiscussionListQuery) {
  return apiClient.get<DiscussionListQueryResult>(`/contests/${encodeURIComponent(contestId)}/discussions`, { params })
}
