import type { OAuthProvider } from '@putongoj/shared/dist/consts'
import { defineStore } from 'pinia'
import vditorInfo from 'vditor/package.json'
import api from '@/api'
import { setServerPublicKey } from '@/utils/crypto'

interface WebsiteInformation {
  title: string
  buildSHA: string
  buildTime: number
  apiPublicKey: string
  oauthEnabled: Record<OAuthProvider, boolean>
  helpDocURL?: string
}

export const useRootStore = defineStore('root', {
  state: () => ({
    currentTime: Date.now(),
    timeDiff: Number.NaN,
    website: {} as WebsiteInformation,
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
      window.document.title = `${payload.title} | ${this.website.title}`
    },
    async fetchTime () {
      const time1 = Date.now()
      const { data: first } = await api.getTime()
      const time2 = Date.now()
      const { data: second } = await api.getTime()
      const time3 = Date.now()

      const localMidTime = (time2 + (time3 + time1) / 2) / 2
      const serverMidTime = (first.serverTime + second.serverTime) / 2

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
    async fetchWebsiteConfig () {
      const { data } = await api.getWebsiteInformaton()
      this.website = data
      setServerPublicKey(this.website.apiPublicKey)
    },
  },
})
