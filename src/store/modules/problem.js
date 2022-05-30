import { defineStore } from 'pinia'
import api from '@/api'

export const useProblemStore = defineStore('problem', {
  state: () => ({
    list: [],
    problem: {},
    sum: 0,
    solved: [],
  }),
  actions: {
    findOne (payload) {
      return api.problem.findOne(payload).then(({ data }) => {
        this.problem = data.problem
        return data
      })
    },
    async find (payload) {
      const { data } = await api.problem.find(payload)
      this.list = data.list.docs
      this.sum = data.list.total
      this.solved = data.solved
    },
    update (payload) {
      return api.problem.update(payload).then(({ data }) => {
        return data
      })
    },
    create (payload) {
      return api.problem.create(payload).then(({ data }) => data.pid)
    },
    delete (payload) {
      return api.problem.delete(payload).then(() => {
        this.list = this.list.filter(p => p.pid !== +(payload.pid))
      })
    },
    clearSavedProblems () {
      this.list = []
    },
  },
})
