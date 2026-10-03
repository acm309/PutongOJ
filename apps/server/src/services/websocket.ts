import type { AdminNotificationCreatePayload, WebSocketDispatch, WebSocketMessage } from '@putong-oj/shared'
import { WEBSOCKET_CHANNEL, WebSocketDispatchType, WebSocketMessageType } from '@putong-oj/shared'
import redis from '../config/redis.ts'

function createNotificationMessage (payload: AdminNotificationCreatePayload): WebSocketMessage {
  const { title, content, severity, duration } = payload
  return {
    type: WebSocketMessageType.Notification,
    data: {
      title,
      content,
      severity,
      life: duration === null ? null : duration * 1000,
    },
  }
}

export async function sendBroadcastNotification (payload: AdminNotificationCreatePayload) {
  const dispatch: WebSocketDispatch = {
    type: WebSocketDispatchType.Broadcast,
    message: createNotificationMessage(payload),
  }
  await redis.publish(WEBSOCKET_CHANNEL, JSON.stringify(dispatch))
}

export async function sendUserNotification (username: string, payload: AdminNotificationCreatePayload) {
  const dispatch: WebSocketDispatch = {
    type: WebSocketDispatchType.User,
    username,
    message: createNotificationMessage(payload),
  }
  await redis.publish(WEBSOCKET_CHANNEL, JSON.stringify(dispatch))
}

const websocketService = {
  sendBroadcastNotification,
  sendUserNotification,
} as const

export default websocketService
