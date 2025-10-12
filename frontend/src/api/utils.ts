import type { Enveloped } from '@putongoj/shared'
import instance from './instance'

export async function getWebSocketToken () {
  const { data } = await instance.get('/websocket/token')
  return data as Enveloped<{ token: string }>
}
