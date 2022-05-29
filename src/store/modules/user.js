import * as types from '../types'
import api from '@/api'
import { defineStore } from 'pinia'

export const useUserStore = defineStore('user', {
  state: () => ({
    registerDialog: false,
    list: [],
    user: {},
    solved: [],
    unsolved: [],
    group: [],
    adminList: []
  }),
  actions: {
    // MUTATIONS from vuex
    [types.SHOW_REGISTER] (state) {
      this.registerDialog = !this.registerDialog
    },
    [types.UPDATE_USER] (payload) {
      this.user = payload
    },
    [types.UPDATE_USERS_LIST] (payload) {
      this.list = payload
    },
    [types.UPDATE_USERS_ADMIN_LIST] (payload) {
      this.adminList = payload
    },
    [types.UPDATE_SOLVED] (payload) {
      this.solved = payload
    },
    [types.UPDATE_UNSOLVED] (payload) {
      this.unsolved = payload
    },
    [types.UPDATE_USER_GROUP] (payload) {
      this.group = payload
    },
    register (payload) {
      return api.register(payload)
    },
    find (payload) {
      return api.user.find(payload).then(({ data }) => {
        if (payload) {
          this[types.UPDATE_USERS_ADMIN_LIST](data.list)
        } else {
          this[types.UPDATE_USERS_LIST](data.list)
        }
      })
    },
    findOne (payload) {
      return api.user.findOne(payload).then(({ data }) => {
        this[types.UPDATE_USER](data.user)
        this[types.UPDATE_SOLVED](data.solved)
        this[types.UPDATE_UNSOLVED](data.unsolved)
        this[types.UPDATE_USER_GROUP](data.group)
      })
    },
    update (payoad) {
      return api.user.update(payoad)
    },
    delete (payload) {
      return api.user.delete(payload)
    }
  }
})
