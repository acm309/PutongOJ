import type { PublicConfigQueryResult } from '@putongoj/shared'
import { defineStore } from 'pinia'
import vditorInfo from 'vditor/package.json'
import { getPublicConfig } from '@/api/utils'
import { setServerPublicKey } from '@/utils/crypto'

export const useRootStore = defineStore('root', {
  state: () => ({
    currentTime: Date.now(),
    timeDiff: Number.NaN,
    config: {} as PublicConfigQueryResult,
    vditorCDN: `${location.origin}/static/vditor-${vditorInfo.version}`,
  }),
  actions: {
    changeDomTitle (payload: { title?: string }) {
      if (!payload?.title) {
        return
      }
      window.document.title = `${payload.title} | ${this.config.name}`
    },
    async fetchTime () {
      this.timeDiff = 0
      this.currentTime = Date.now()
    },
    updateTime () {
      setTimeout(() => {
        this.currentTime = Date.now() - this.timeDiff
        setInterval(() => {
          this.currentTime = Date.now() - this.timeDiff
        }, 1000)
      }, 1000 - this.currentTime % 1000)
    },
    async fetchPublicConfig () {
      const { success, data } = await getPublicConfig()
      if (!success) {
        return
      }

      this.config = data
      setServerPublicKey(data.apiPublicKey)
    },
  },
})
