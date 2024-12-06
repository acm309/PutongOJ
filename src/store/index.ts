import { defineStore } from 'pinia'
import api from '@/api'
import type { WebsiteConfigResp } from '@/types'
import { privilege } from '@/util/constant'

export const useRootStore = defineStore('root', {
  state: () => ({
    currentTime: Date.now(),
    timeDiff: 0,
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
      const { data: first } = await api.getTime();
      const midTime = Date.now();
      const { data: second } = await api.getTime();
      const endTime = Date.now();
    
      const serverTime = Math.round((first.serverTime + second.serverTime) / 2);
      this.timeDiff = midTime - serverTime;
      this.currentTime = endTime - this.timeDiff;
    },
    updateTime () {
      setTimeout(() => {
        this.currentTime = Date.now() - this.timeDiff
        setInterval(() => {
          this.currentTime = Date.now() - this.timeDiff
        }, 1000)
      }, 1000 - this.currentTime % 1000)
    },
    async fetchWebsiteConfig () {
      const { data } = await api.getWebsiteConfig()
      this.website = data.website
    },
  },
})
