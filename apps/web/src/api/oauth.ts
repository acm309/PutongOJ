import type {
  OAuthCallbackQuery,
  OAuthCallbackQueryResult,
  OAuthGenerateUrlQuery,
  OAuthGenerateUrlQueryResult,
  OAuthProvider,
  OAuthUserConnectionsQueryResult,
} from '@putong-oj/shared'
import { apiClient } from './instance'

export async function generateOAuthUrl (provider: OAuthProvider, params: OAuthGenerateUrlQuery) {
  return apiClient.get<OAuthGenerateUrlQueryResult>(
    `/oauth/${provider}/url`,
    { params, callerHandledCodes: 'all' },
  )
}

export async function handleOAuthCallback (provider: OAuthProvider, params: OAuthCallbackQuery) {
  return apiClient.get<OAuthCallbackQueryResult>(
    `/oauth/${provider}/callback`,
    { params, callerHandledCodes: 'all' },
  )
}

export async function getUserOAuthConnections () {
  return apiClient.get<OAuthUserConnectionsQueryResult>('/oauth')
}
