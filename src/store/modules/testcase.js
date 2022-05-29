import api from '@/api'
import { defineStore } from 'pinia'

export const useTestcaseStore = defineStore('testcase', {
  state: () => ({
    list: [],
    testcase: {}
  }),
  actions: {
    async findOne (payload) {
      const {data} = await api.testcase.findOne(payload)
      this.testcase = data
    },
    async find (payload) {
      const {data} = await api.testcase.find(payload)
      this.list = data
      return data
    },
    create (payload) {
      return api.testcase.create(payload)
    },
    async delete (payload) {
      const {data} = await api.testcase.delete(payload)
      this.list = data
    }
  }
})
