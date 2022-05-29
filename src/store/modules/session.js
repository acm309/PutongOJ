import * as types from '../types'
import api from '@/api'
import { defineStore } from 'pinia'
import { useRootStore } from '..'

export const useSessionStore = defineStore('session', {
  state: () => ({
    loginDialog: false,
    profile: null
  }),
  getters: {
    isLogined () { return this.profile != null },
    isAdmin () {
      return this.isLogined &&
      (
        parseInt(this.profile.privilege) === parseInt(useRootStore().privilege.Root) ||
        parseInt(this.profile.privilege) === parseInt(useRootStore().privilege.Teacher)
      )
    },
    canRemove () {
      return this.isLogined &&
      (
        parseInt(this.profile.privilege) === parseInt(useRootStore().privilege.Root)
      )
    }
  },
  actions: {
    [types.LOGIN] (payload) {
      this.profile = payload // TODO
    },
    [types.LOGOUT] () {
      this.profile = null
    },
    [types.TRIGGER_LOGIN] () {
      this.loginDialog = !this.loginDialog
    },
    [types.UPDATE_PROFILE] (payload) {
      this.profile = payload
    },
    login (opt) {
      return api.login(opt).then(({ data }) => {
        this.profile = data.profile
        return data
      })
    },
    logout () {
      return api.logout().then(() => {
        this.profile = null
      })
    },
    fetch () {
      return api.session.fetch().then(({ data }) => {
        this.profile = data.profile
        console.log(this.profile, this.isAdmin)
      })
    }
  }
})
