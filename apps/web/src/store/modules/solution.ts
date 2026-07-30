import type { SubmissionDetailQueryResult, SubmissionStatusUpdatePayload } from '@putongoj/shared'
import { defineStore } from 'pinia'
import { getSubmission, updateSubmissionStatus } from '@/api/solution'

export const useSolutionStore = defineStore('solution', {
  state: () => ({
    submission: null as SubmissionDetailQueryResult | null,
  }),
  actions: {
    async findOne (submissionId: number) {
      const response = await getSubmission(submissionId)
      if (response.success) {
        this.submission = response.data
      }
      return response
    },
    async updateStatus (submissionId: number, status: SubmissionStatusUpdatePayload['status']) {
      return updateSubmissionStatus(submissionId, status)
    },
  },
})
