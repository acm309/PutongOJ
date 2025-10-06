import type { OAuthCallbackResponse } from '@backend/controllers/oauth'
import type { OAuthEntityUserView } from '@backend/models/OAuth'
import type { Enveloped, OAuthAction, OAuthProvider } from '@putongoj/shared'
import { instance } from './instance'

export async function generateOAuthUrl (provider: Lowercase<OAuthProvider>, params: { action: OAuthAction }) {
  const { data } = await instance.get(`/oauth/${provider}/url`, { params })
  return data as { url: string }
}

export async function handleOAuthCallback (provider: Lowercase<OAuthProvider>, params: { state: string, code: string }) {
  const { data } = await instance.get(`/oauth/${provider}/callback`, { params })
  return data as Enveloped<OAuthCallbackResponse>
}

export async function getUserOAuthConnections () {
  const { data } = await instance.get('/oauth')
  return data as Record<OAuthProvider, OAuthEntityUserView | null>
}
