import type { AvatarPresetsQueryResult, PublicConfigQueryResult } from '@putongoj/shared'
import { instanceSafe as instance } from './instance'

export async function getPublicConfig () {
  return instance.get<PublicConfigQueryResult>('/config')
}

export async function getWebSocketToken () {
  return instance.get<{ token: string }>('/websocket/token')
}

export async function getAvatarPresets () {
  return instance.get<AvatarPresetsQueryResult>('/utils/avatar-presets')
}
