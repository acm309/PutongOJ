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
        return false
      }
      this.solution = response.data
      return true
    },
    async updateSolution (payload: SolutionStatusUpdatePayload) {
      const solutionId = (this.solution as any).sid!
      const response = await updateSolution(solutionId, payload)
      if (!response.success) {
        return response
      }
      this.solution = response.data
      return response
    },
  },
})
