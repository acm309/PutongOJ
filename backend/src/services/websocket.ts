import type { WebSocketDispatch, WebSocketMessage } from '@putongoj/shared'
import { WebSocketDispatchType, WebSocketMessageType } from '@putongoj/shared'
import redis from '../config/redis'

const CHANNEL = 'websocket:message'

export async function sendBroadcastNotification (title: string, content: string) {
  const message: WebSocketMessage = {
    type: WebSocketMessageType.Notification,
    data: { title, content },
  }
  const dispatch: WebSocketDispatch = {
    type: WebSocketDispatchType.Broadcast,
    message,
  }
  await redis.publish(CHANNEL, JSON.stringify(dispatch))
}

const websocketService = {
  sendBroadcastNotification,
} as const

export default websocketService
