import type { OAuthEntityUserView } from '@backend/models/OAuth'
import type { OAuthProvider } from '@backend/services/oauth'
import { defineStore } from 'pinia'
import api from '@/api'

export const useOAuthStore = defineStore('oauth', {
  state: () => ({
    connections: {
      CJLU: null,
    } as Record<OAuthProvider, OAuthEntityUserView | null>,
  }),
  actions: {
    async fetchConnections () {
      const { data } = await api.oauth.getUserOAuthConnections()
      this.connections = data
    },
  },
})
