import type { ProblemEntityView } from '@backend/types/entity'
import type { Paginated, ProblemBrief } from '@/types'
import type { FindProblemsParams } from '@/types/api'
import { defineStore } from 'pinia'
import api from '@/api'

export const useProblemStore = defineStore('problem', {
  state: () => ({
    /** @deprecated */
    list: [] as ProblemBrief[],
    problem: {} as ProblemEntityView,
    /** @deprecated */
    sum: 0,
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
    /** @deprecated */
    async find (payload: { [key: string]: any }) {
      const { data } = await api.problem.find(payload)
      this.list = data.list.docs
      this.sum = data.list.total
      this.solved = data.solved
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
      return api.problem.delete(payload).then(() => {
        this.list = this.list.filter(p => p.pid !== +(payload.pid))
      })
    },
    clearSavedProblems () {
      this.list = []
    },
  },
})
