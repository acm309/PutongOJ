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
    toggleLoginState () {
      this.loginDialog = !this.loginDialog
    },
    setLoginProfile (profile) {
      this.profile = profile
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
      })
    }
  }
})
