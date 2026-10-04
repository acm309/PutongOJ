import type {
  AvatarPresetsQueryResult,
  NotificationTokenQueryResult,
  PublicConfigQueryResult,
  ServerTimeQueryResult,
} from '@putong-oj/shared'
import { apiClient } from './instance'

export async function getServerTime () {
  return apiClient.get<ServerTimeQueryResult>('/servertime')
}

export async function getPublicConfig () {
  return apiClient.get<PublicConfigQueryResult>('/config')
}

export async function getNotificationToken () {
  return apiClient.get<NotificationTokenQueryResult>('/notifications/token')
}

export async function getAvatarPresets () {
  return apiClient.get<AvatarPresetsQueryResult>('/utils/avatar-presets')
}
