import { defineStore } from 'pinia'
import { useRootStore } from '..'
import api from '@/api'
import type { LoginParam, Profile } from '@/types'
import { privilege } from '@/util/constant'

export const useSessionStore = defineStore('session', {
  state: () => ({
    loginDialog: false,
    profile: null as (null | Profile),
  }),
  getters: {
    isLogined: state => state.profile != null,
    // Return type must be set in order to use `this`
    // https://pinia.vuejs.org/core-concepts/getters.html#getters
    isAdmin (): boolean {
      return this.isLogined
        && (this.profile?.privilege === privilege.Root
        || this.profile?.privilege === privilege.Teacher)
    },
    canRemove (): boolean {
      return this.isLogined && (this.profile?.privilege === useRootStore().privilege.Root)
    },
  },
  actions: {
    toggleLoginState () {
      this.loginDialog = !this.loginDialog
    },
    setLoginProfile (profile: Profile) {
      this.profile = profile
    },
    async login (opt: LoginParam) {
      const { data } = await api.login(opt)
      this.profile = data.profile
      return data
    },
    async logout () {
      await api.logout()
      this.profile = null
    },
    async fetch () {
      const { data } = await api.session.fetch()
      this.profile = data.profile
    },
  },
})
