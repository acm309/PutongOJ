import type {
  OAuthCallbackQuery,
  OAuthCallbackQueryResult,
  OAuthGenerateUrlQuery,
  OAuthGenerateUrlQueryResult,
  OAuthProvider,
  OAuthUserConnectionsQueryResult,
} from '@putongoj/shared'
import { instanceSafe as instance } from './instance'

export async function generateOAuthUrl (provider: OAuthProvider, params: OAuthGenerateUrlQuery) {
  return instance.get<OAuthGenerateUrlQueryResult>(`/oauth/${provider}/url`, { params })
}

export async function handleOAuthCallback (provider: OAuthProvider, params: OAuthCallbackQuery) {
  return instance.get<OAuthCallbackQueryResult>(`/oauth/${provider}/callback`, { params })
}

export async function getUserOAuthConnections () {
  return instance.get<OAuthUserConnectionsQueryResult>('/oauth')
}
