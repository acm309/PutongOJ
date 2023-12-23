import { defineStore } from 'pinia'
import api from '@/api'

export const useUserStore = defineStore('user', {
  state: () => ({
    registerDialog: false,
    list: [],
    user: {},
    solved: [],
    unsolved: [],
    group: [],
    adminList: [],
  }),
  actions: {
    register (payload) {
      return api.register(payload)
    },
    async find (payload) {
      const { data } = await api.user.find(payload)
      if (payload)
        this.adminList = data.list
      else
        this.list = data.list
    },
    async findOne (payload) {
      const { data } = await api.user.findOne(payload)
      this.user = data.user
      this.solved = data.solved
      this.unsolved = data.unsolved
      this.group = data.group
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
