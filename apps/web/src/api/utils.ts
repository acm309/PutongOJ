import type {
  AvatarPresetsQueryResult,
  PublicConfigQueryResult,
  ServerTimeQueryResult,
  WebSocketTokenQueryResult,
} from '@putong-oj/shared'
import { apiClient } from './instance'

export async function getServerTime () {
  return apiClient.get<ServerTimeQueryResult>('/servertime')
}

export async function getPublicConfig () {
  return apiClient.get<PublicConfigQueryResult>('/config')
}

export async function getWebSocketToken () {
  return apiClient.get<WebSocketTokenQueryResult>('/websocket/token')
}

export async function getAvatarPresets () {
  return apiClient.get<AvatarPresetsQueryResult>('/utils/avatar-presets')
}
