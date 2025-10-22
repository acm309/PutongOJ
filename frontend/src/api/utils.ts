import { instanceSafe as instance } from './instance'

export async function getWebSocketToken () {
  return instance.get<{ token: string }>('/websocket/token')
}
