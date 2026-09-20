import type { WebSocketDispatch, WebSocketMessage } from '@putong-oj/shared'
import { WEBSOCKET_CHANNEL, WebSocketDispatchType, WebSocketMessageType } from '@putong-oj/shared'
import redis from '../config/redis.ts'

export async function sendBroadcastNotification (title: string, content: string) {
  const message: WebSocketMessage = {
    type: WebSocketMessageType.Notification,
    data: { title, content },
  }
  const dispatch: WebSocketDispatch = {
    type: WebSocketDispatchType.Broadcast,
    message,
  }
  await redis.publish(WEBSOCKET_CHANNEL, JSON.stringify(dispatch))
}

export async function sendUserNotification (username: string, title: string, content: string) {
  const message: WebSocketMessage = {
    type: WebSocketMessageType.Notification,
    data: { title, content },
  }
  const dispatch: WebSocketDispatch = {
    type: WebSocketDispatchType.User,
    username,
    message,
  }
  await redis.publish(WEBSOCKET_CHANNEL, JSON.stringify(dispatch))
}

const websocketService = {
  sendBroadcastNotification,
  sendUserNotification,
} as const

export default websocketService
