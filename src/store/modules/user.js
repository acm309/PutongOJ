import { defineStore } from 'pinia'
import api from '@/api'

export const useUserStore = defineStore('user', {
  state: () => ({
    registerDialog: false,
    list: [],
    sum: 0,
    user: {},
    solved: [],
    unsolved: [],
    adminList: [],
  }),
  actions: {
    register (payload) {
      return api.register(payload)
    },
    async find (payload) {
      const { data } = await api.user.find(payload)
      this.list = data.docs
      this.sum = data.total
    },
    async findOne (payload) {
      const { data } = await api.user.findOne(payload)
      this.user = data.user
      this.solved = data.solved
      this.unsolved = data.unsolved
    },
    update (payoad) {
      return api.user.update(payoad)
    },
    delete (payload) {
      return api.user.delete(payload)
    },
    clearSavedUsers () {
      this.list = []
    },
  },
})
