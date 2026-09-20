import type {
  SolutionDetailQueryResult,
  SolutionStatusUpdatePayload,
  SolutionSubmitPayload,
  SolutionSubmitResult,
  SolutionUpdateQueryResult,
} from '@putong-oj/shared'
import { instanceSafe as instance } from './instance'

export async function findSolution (solutionId: number) {
  return instance.get<SolutionDetailQueryResult>(`/status/${encodeURIComponent(solutionId)}`)
}

export async function updateSolution (solutionId: number, payload: SolutionStatusUpdatePayload) {
  return instance.put<SolutionUpdateQueryResult>(`/status/${encodeURIComponent(solutionId)}`, payload)
}

export async function createSolution (payload: SolutionSubmitPayload) {
  return instance.post<SolutionSubmitResult>('/status', payload)
}
