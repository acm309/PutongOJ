import type { ProblemDetailQueryResult, ProblemListQuery, ProblemListQueryResult, ProblemUpdatePayload } from '@putongoj/shared'
import { defineStore } from 'pinia'
import { createProblem, findProblems, getProblem, removeProblem, updateProblem } from '@/api/problem'

export const useProblemStore = defineStore('problem', {
  state: () => ({
    problem: null as ProblemDetailQueryResult | null,
    solvedProblemIds: [] as number[],
    problems: {
      items: [],
      page: 1,
      pageSize: 30,
      total: 0,
      solvedProblemIds: [],
    } as ProblemListQueryResult,
  }),
  actions: {
    async findProblems (params: ProblemListQuery) {
      const response = await findProblems(params)
      if (response.success) {
        this.problems = response.data
        this.solvedProblemIds = response.data.solvedProblemIds
      }
      return response
    },
    async findOne (problemId: number) {
      const response = await getProblem(problemId)
      if (response.success) {
        this.problem = response.data
      }
      return response
    },
    async update (problemId: number, payload: ProblemUpdatePayload) {
      return updateProblem(problemId, payload)
    },
    async create (payload: Parameters<typeof createProblem>[0]) {
      return createProblem(payload)
    },
    async remove (problemId: number) {
      return removeProblem(problemId)
    },
  },
})
