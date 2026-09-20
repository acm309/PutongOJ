import type {
  ProblemCreatePayload,
  ProblemDetailQueryResult,
  ProblemListQuery,
  ProblemListQueryResult,
  ProblemUpdatePayload,
} from '@putong-oj/shared'
import { defineStore } from 'pinia'
import {
  createProblem,
  findProblem,
  findProblems,
  removeProblem,
  updateProblem,
} from '@/api/problem'

export const useProblemStore = defineStore('problem', {
  state: () => ({
    problem: {} as ProblemDetailQueryResult,
    solved: [] as number[],
    problems: {
      docs: [],
      limit: 0,
      page: 1,
      pages: 0,
      total: 0,
    } as ProblemListQueryResult['list'],
  }),
  actions: {
    async findProblems (params: ProblemListQuery) {
      const response = await findProblems(params)
      if (!response.success) {
        return
      }
      this.problems = response.data.list
      this.solved = response.data.solved
    },
    async findOne (pid: number, contestId?: number) {
      const response = await findProblem(pid, contestId)
      if (!response.success) {
        return null
      }
      this.problem = response.data
      return { problem: response.data }
    },
    async update (payload: ProblemUpdatePayload & { pid: number }) {
      const response = await updateProblem(payload)
      if (!response.success) {
        throw new Error(response.message)
      }
      return response.data
    },
    async create (payload: ProblemCreatePayload) {
      const response = await createProblem(payload)
      if (!response.success) {
        throw new Error(response.message)
      }
      return response.data.pid
    },
    async delete (pid: number) {
      return removeProblem(pid)
    },
  },
})
