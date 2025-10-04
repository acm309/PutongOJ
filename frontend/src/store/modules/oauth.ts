import type { OAuthEntityUserView } from '@backend/models/OAuth'
import type { OAuthProvider } from '@putongoj/shared'
import { defineStore } from 'pinia'
import { getUserOAuthConnections } from '@/api/oauth'

export const useOAuthStore = defineStore('oauth', {
  state: () => ({
    connections: {
      CJLU: null,
    } as Record<OAuthProvider, OAuthEntityUserView | null>,
  }),
  actions: {
    async fetchConnections () {
      const data = await getUserOAuthConnections()
      this.connections = data
    },
  },
})
