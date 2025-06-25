import { defineStore } from 'pinia'
import api from '@/api'
import type { Solution } from '@/types'

export const useSolutionStore = defineStore('solution', {
  state: () => ({
    list: [],
    solution: {
      language: null,
      code: '',
    } as Solution,
    sum: 0,
  }),
  actions: {
    async find (payload: { [key: string]: any }) {
      const { data } = await api.solution.find(payload)
      this.list = data.list.docs
      this.sum = data.list.total
    },
    async findOne (payload: { [key: string]: any }) {
      const { data } = await api.solution.findOne(payload)
      this.solution = data.solution
    },
    create (payload: { [key: string]: any }) {
      return api.solution.create(payload)
    },
    clearSavedSolution () {
      this.solution = { language: null, code: '' }
    },
    clearCode () {
      this.solution.code = ''
    },
  },
})
