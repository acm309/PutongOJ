import type {
  SolutionDetailQueryResult,
  SolutionStatusUpdatePayload,
  SolutionSubmitPayload,
  SolutionSubmitResult,
  SolutionUpdateQueryResult,
} from '@putong-oj/shared'
import { apiClient } from './instance'

export async function findSolution (solutionId: number) {
  return apiClient.get<SolutionDetailQueryResult>(`/status/${encodeURIComponent(solutionId)}`)
}

export async function updateSolution (solutionId: number, payload: SolutionStatusUpdatePayload) {
  return apiClient.put<SolutionUpdateQueryResult>(`/status/${encodeURIComponent(solutionId)}`, payload)
}

export async function createSolution (payload: SolutionSubmitPayload) {
  return apiClient.post<SolutionSubmitResult>('/status', payload)
}
