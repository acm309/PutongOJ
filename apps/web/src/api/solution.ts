import type {
  SolutionSubmitPayload,
  SolutionSubmitResult,
  SubmissionDetailQueryResult,
  SubmissionStatusUpdatePayload,
} from '@putongoj/shared'
import { instanceSafe as instance } from './instance'

export async function createSolution (payload: SolutionSubmitPayload) {
  return instance.post<SolutionSubmitResult>('/submissions', payload)
}

export async function getSubmission (submissionId: number) {
  return instance.get<SubmissionDetailQueryResult>(`/submissions/${submissionId}`)
}

export async function updateSubmissionStatus (
  submissionId: number,
  status: SubmissionStatusUpdatePayload['status'],
) {
  return instance.put(`/submissions/${submissionId}`, { status })
}
