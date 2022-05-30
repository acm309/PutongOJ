import { defineStore } from 'pinia'
import api from '@/api'

export const useRootStore = defineStore('root', {
  state: () => ({
    currentTime: Date.now(),
    website: {},
    privilege: {
      PrimaryUser: 1,
      Teacher: 2,
      Root: 3,
    },
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
    changeDomTitle (payload) {
      if (payload && payload.title) {
        window.document.title = payload.title
      }
      window.document.title += ` | ${this.website.title}`
    },
    fetchTime () {
      return api.getTime().then(({ data }) => {
        this.currentTime = data.serverTime
      })
    },
    updateTime () {
      setInterval(() => {
        this.currentTime += 1000
      }, 1000)
    },
    fetchWebsiteConfig () {
      return api.getWebsiteConfig().then(({ data }) => {
        this.website = data.website
      })
    },
  },
})
