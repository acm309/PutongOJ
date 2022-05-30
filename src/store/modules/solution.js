import { defineStore } from 'pinia'
import api from '@/api'

export const useSolutionStore = defineStore('solution', {
  state: () => ({
    list: [],
    solution: null,
    sum: 0,
  }),
  actions: {
    async find (payload) {
      const { data } = await api.solution.find(payload)
      this.list = data.list.docs
      this.sum = data.list.total
    },
    async findOne (payload) {
      const { data } = await api.solution.findOne(payload)
      this.solution = data.solution
    },
    create (payload) {
      return api.solution.create(payload)
    },
    clearSavedSolution () {
      this.solution = {}
    },
    clearCode () {
      this.solution.code = ''
    },
  },
})
