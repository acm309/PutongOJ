import type { SolutionSubmitPayload, SolutionSubmitResult } from '@putong-oj/shared'
import { instanceSafe as instance } from './instance'

export async function createSolution (payload: SolutionSubmitPayload) {
  return instance.post<SolutionSubmitResult>('/status', payload)
}
