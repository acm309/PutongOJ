import type { AccountProfileQueryResult } from '@putongoj/shared'
import { UserPrivilege } from '@putongoj/shared'
import { defineStore } from 'pinia'
import { getProfile, userLogout } from '@/api/account'

export const useSessionStore = defineStore('session', {
  state: () => ({
    authnDialog: false,
    profile: null as (AccountProfileQueryResult | null),
  }),
  getters: {
    isLogined (): boolean {
      return this.profile !== null
    },
    isAdmin (): boolean {
      return this.profile?.privilege === UserPrivilege.Admin || this.isRoot
    },
    isRoot (): boolean {
      return this.profile?.privilege === UserPrivilege.Root
    },
  },
  actions: {
    toggleAuthnDialog () {
      this.authnDialog = !this.authnDialog
    },
    setProfile (profile: AccountProfileQueryResult) {
      this.profile = profile
    },
    clearProfile () {
      this.profile = null
    },
    async fetchProfile () {
      const resp = await getProfile()
      if (resp.success) {
        this.setProfile(resp.data)
      }
      return resp
    },
    async userLogout () {
      this.clearProfile()
      sessionStorage.clear()
      await userLogout()
    },
  },
})
