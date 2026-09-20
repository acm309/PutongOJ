import type {
  AvatarPresetsQueryResult,
  PublicConfigQueryResult,
  ServerTimeQueryResult,
  WebSocketTokenQueryResult,
} from '@putong-oj/shared'
import { instanceSafe as instance } from './instance'

export async function getServerTime () {
  return instance.get<ServerTimeQueryResult>('/servertime')
}

export async function getPublicConfig () {
  return instance.get<PublicConfigQueryResult>('/config')
}

export async function getWebSocketToken () {
  return instance.get<WebSocketTokenQueryResult>('/websocket/token')
}

export async function getAvatarPresets () {
  return instance.get<AvatarPresetsQueryResult>('/utils/avatar-presets')
}
