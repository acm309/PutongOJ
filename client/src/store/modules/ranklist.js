import { defineStore } from 'pinia'
import api from '@/api'

export const useRanklistStore = defineStore('ranklist', {
  state: () => ({
    list: [],
    sum: 0,
  }),
  actions: {
    async find (payload) {
      const { data } = await api.getRanklist(payload)
      this.list = data.list.docs
      this.sum = data.list.total
    },
  },
})
