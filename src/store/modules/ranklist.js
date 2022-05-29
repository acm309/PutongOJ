import api from '@/api'
import { defineStore } from 'pinia'

export const useRanklistStore = defineStore('ranklist', {
  state: () => ({
    list: [],
    sum: 0
  }),
  actions: {
    async find (payload) {
      const {data} = await api.getRanklist(payload)
      this.list = data.list.docs
      this.sum = data.list.total
    }
  }
})
