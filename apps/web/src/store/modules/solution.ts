import type { SolutionStatusUpdatePayload } from '@putong-oj/shared'
import { defineStore } from 'pinia'
import { findSolution, updateSolution } from '@/api/solution'

export const useSolutionStore = defineStore('solution', {
  state: () => ({
    solution: {
      language: null,
      code: '',
    } as any,
  }),
  actions: {
    async findOne (solutionId: number) {
      const response = await findSolution(solutionId)
      if (!response.success) {
        throw new Error(response.message)
      }
      this.solution = response.data
    },
    async updateSolution (payload: SolutionStatusUpdatePayload) {
      const solutionId = (this.solution as any).sid!
      const response = await updateSolution(solutionId, payload)
      if (!response.success) {
        throw new Error(response.message)
      }
      this.solution = response.data
      return response
    },
  },
})
