import type { PublicConfigQueryResult } from '@putong-oj/shared'
import { defineStore } from 'pinia'
import vditorInfo from 'vditor/package.json'
import { getPublicConfig, getServerTime } from '@/api/utils'
import { setServerPublicKey } from '@/utils/crypto'

export const useRootStore = defineStore('root', {
  state: () => ({
    currentTime: Date.now(),
    timeDiff: Number.NaN,
    config: {} as PublicConfigQueryResult,
    vditorCDN: `${location.origin}/static/vditor-${vditorInfo.version}`,
    // Todo: remove
    status: {
      Reserve: 0,
      Available: 2,
    },
    encrypt: {
      Public: 1,
      Private: 2,
      Password: 3,
    },
  }),
  actions: {
    changeDomTitle (payload: { title?: string }) {
      if (!payload?.title) {
        return
      }
      window.document.title = `${payload.title} | ${this.config.name}`
    },
    async fetchTime () {
      const time1 = Date.now()
      const firstResponse = await getServerTime()
      const time2 = Date.now()
      const secondResponse = await getServerTime()
      const time3 = Date.now()
      if (!firstResponse.success || !secondResponse.success) {
        return
      }

      const localMidTime = (time2 + (time3 + time1) / 2) / 2
      const serverMidTime = (firstResponse.data.serverTime + secondResponse.data.serverTime) / 2

      this.timeDiff = localMidTime - serverMidTime
      this.currentTime = Date.now() - this.timeDiff
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
