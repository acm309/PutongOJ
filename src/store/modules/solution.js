import api from '@/api'
import { defineStore } from 'pinia'

export const useSolutionStore = defineStore('solution', {
  state: () => ({
    list: [],
    solution: null,
    sum: 0
  }),
  actions: {
    find (payload) {
      return api.solution.find(payload).then(({ data }) => {
        this.list = data.list.docs
        this.sum = data.list.total
      })
    },
    findOne (payload) {
      return api.solution.findOne(payload).then(({ data }) => {
        this.solution = data.solution
      })
    },
    create (payload) {
      return api.solution.create(payload)
    },
    clearSavedSolution () {
      this.solution = {}
    },
    clearCode () {
      this.solution.code = ''
    }
  }
})
