import type { ProblemEntityView } from '@backend/types/entity'
import type { Paginated } from '@putongoj/shared'
import type { ProblemBrief } from '@/types'
import type { FindProblemsParams } from '@/types/api'
import { defineStore } from 'pinia'
import api from '@/api'

export const useProblemStore = defineStore('problem', {
  state: () => ({
    problem: {} as ProblemEntityView,
    solved: [] as number[],
    problems: {} as Paginated<ProblemBrief>,
  }),
  actions: {
    async findProblems (params: FindProblemsParams) {
      const { data } = await api.problem.findProblems(params)
      this.problems = data.list
      this.solved = data.solved
    },
    async findOne (payload: { pid: number, [key: string]: any }) {
      const { data } = await api.problem.findOne(payload)
      this.problem = data
      return { problem: data }
    },
    async update (payload: { [key: string]: any }) {
      return api.problem.update(payload).then(({ data }) => {
        return data
      })
    },
    async create (payload: { [key: string]: any }) {
      return api.problem.create(payload).then(({ data }) => data.pid)
    },
    async delete (payload: { [key: string]: any }) {
      return api.problem.delete(payload)
    },
  },
})
