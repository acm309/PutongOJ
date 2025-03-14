import { defineStore } from 'pinia'
import axios from 'axios'
import { MD5 } from 'crypto-js'
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
      this.fetchAvatar()
    },
    update (payoad) {
      this.fetchAvatar()
      return api.user.update(payoad)
    },
    delete (payload) {
      return api.user.delete(payload)
    },
    async fetchAvatar () {
      if (typeof this.user.mail === 'string'
        && this.user.privilege > 1
        && this.user.mail.trim().length > 0
      ) {
        const mailHash = MD5(this.user.mail.trim().toLowerCase()).toString()
        const cravatar = `https://cravatar.cn/avatar/${mailHash}?d=404&s=256`
        const response = await axios.get(cravatar, {
          withCredentials: false,
          responseType: 'blob',
        })
        if (response.status === 200) {
          this.user.avatar = URL.createObjectURL(response.data)
        }
      }
    },
    clearSavedUsers () {
      this.list = []
    },
  },
})
