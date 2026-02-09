import type {
  ContestConfigEditPayload,
  ContestConfigQueryResult,
  ContestCreatePayload,
  ContestDetailQueryResult,
  ContestListQuery,
  ContestListQueryResult,
  ContestParticipatePayload,
  ContestParticipationQueryResult,
  ContestRanklistQueryResult,
  ContestSolutionListExportQuery,
  ContestSolutionListExportQueryResult,
  ContestSolutionListQuery,
  ContestSolutionListQueryResult,
  DiscussionListQuery,
  DiscussionListQueryResult,
} from '@putongoj/shared'

import { instanceSafe as instance } from './instance'

export async function findContests (params: ContestListQuery) {
  return instance.get<ContestListQueryResult>('/contests', { params })
}

export async function createContest (payload: ContestCreatePayload) {
  return instance.post<{ contestId: number }>('/contests', payload)
}
export async function getContest (contestId: number) {
  return instance.get<ContestDetailQueryResult>(`/contests/${encodeURIComponent(contestId)}`)
}

export async function getContestRanklist (contestId: number) {
  return instance.get<ContestRanklistQueryResult>(`/contests/${encodeURIComponent(contestId)}/ranklist`)
}

export async function getParticipation (contestId: number) {
  return instance.get<ContestParticipationQueryResult>(`/contests/${encodeURIComponent(contestId)}/participation`)
}
export async function participateContest (contestId: number, payload: ContestParticipatePayload) {
  return instance.post<null>(`/contests/${encodeURIComponent(contestId)}/participation`, payload)
}

export async function getConfig (contestId: number) {
  return instance.get<ContestConfigQueryResult>(`/contests/${encodeURIComponent(contestId)}/configs`)
}
export async function updateConfig (contestId: number, config: ContestConfigEditPayload) {
  return instance.put<null>(`/contests/${encodeURIComponent(contestId)}/configs`, config)
}

export async function findSolutions (contestId: number, params: ContestSolutionListQuery) {
  return instance.get<ContestSolutionListQueryResult>(`/contests/${encodeURIComponent(contestId)}/solutions`, { params })
}
export async function exportSolutions (contestId: number, params: ContestSolutionListExportQuery) {
  return instance.get<ContestSolutionListExportQueryResult>(`/contests/${encodeURIComponent(contestId)}/solutions/export`, { params })
}

export async function findContestDiscussions (contestId: number, params: DiscussionListQuery) {
  return instance.get<DiscussionListQueryResult>(`/contests/${encodeURIComponent(contestId)}/discussions`, { params })
}
