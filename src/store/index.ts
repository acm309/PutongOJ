import { defineStore } from 'pinia'
import api from '@/api'
import type { WebsiteConfigResp } from '@/types'
import { privilege } from '@/util/constant'

export const useRootStore = defineStore('root', {
  state: () => ({
    currentTime: Date.now(),
    website: {} as WebsiteConfigResp['website'],
    // Todo: remove
    privilege,
    status: {
      Reserve: 0,
      Available: 2,
    },
    encrypt: {
      Public: 1,
      Private: 2,
      Password: 3,
    },
    judge: {
      Pending: 0,
      Running: 1,
      CompileError: 2,
      Accepted: 3,
      RuntimeError: 4,
      WrongAnswer: 5,
      TimeLimitExceeded: 6,
      MemoryLimitExceed: 7,
      OutputLimitExceed: 8,
      PresentationError: 9,
      SystemError: 10,
      RejudgePending: 11,
    },
  }),
  actions: {
    changeDomTitle (payload: { title: string }) {
      if (payload && payload.title)
        window.document.title = payload.title

      window.document.title += ` | ${this.website.title}`
    },
    async fetchTime () {
      const { data } = await api.getTime()
      this.currentTime = data.serverTime
    },
    updateTime () {
      setInterval(() => {
        this.currentTime += 1000
      }, 1000)
    },
    async fetchWebsiteConfig () {
      const { data } = await api.getWebsiteConfig()
      this.website = data.website
    },
  },
})
