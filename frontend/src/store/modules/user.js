import { md5 } from '@noble/hashes/legacy.js'
import { bytesToHex } from '@noble/hashes/utils'
import axios from 'axios'
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
    async register (payload) {
      const { data } = await api.user.userRegister(payload)
      return data
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
      this.user.avatar = null
      if (typeof this.user.mail === 'string'
        && this.user.privilege > 1
        && this.user.mail.trim().length > 0
      ) {
        const mailHash = bytesToHex(md5(
          new TextEncoder().encode(this.user.mail.trim().toLowerCase()),
        ))
        const cravatar = `https://cn.cravatar.com/avatar/${mailHash}?d=404&s=256`
        const response = await axios.get(cravatar, {
          withCredentials: false,
          responseType: 'blob',
        }).catch(() => {
          return { status: 404 }
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
