import type { NotificationMessage } from '@putong-oj/shared'
import type { MessageService } from './message'
import { NotificationMessageSchema, NotificationMessageType } from '@putong-oj/shared'
import { useI18n } from 'vue-i18n'
import { getNotificationToken } from '@/api/utils'
import { judgeStatusLabels } from './constant'
import emitter from './emitter'
import { useMessage } from './message'

function parseNotificationMessage (data: unknown): NotificationMessage | null {
  if (typeof data !== 'string') {
    return null
  }
  try {
    const result = NotificationMessageSchema.safeParse(JSON.parse(data))
    return result.success ? result.data : null
  } catch {
    return null
  }
}

class NotificationService {
  private socket: WebSocket | null = null
  private enabled = false
  private connecting = false
  private reconnectAttempts = 0
  private readonly maxReconnectAttempts = 5
  private readonly reconnectInterval = 3000
  private readonly messageService: MessageService
  private readonly t: ReturnType<typeof useI18n>['t']

  constructor () {
    this.t = useI18n().t
    this.messageService = useMessage()
  }

  async connect (): Promise<void> {
    this.enabled = true
    if (this.connecting) {
      return
    }
    if (this.socket && (this.socket.readyState === WebSocket.OPEN || this.socket.readyState === WebSocket.CONNECTING)) {
      return
    }

    this.connecting = true
    try {
      const resp = await getNotificationToken()
      if (!this.enabled) {
        return
      }
      if (!resp.success) {
        console.error('Failed to get notification token')
        return
      }

      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
      const streamUrl = `${protocol}//${window.location.host}/ws?token=${resp.data.token}`
      const socket = new WebSocket(streamUrl)
      this.socket = socket

      socket.onopen = () => {
        this.reconnectAttempts = 0
      }

      socket.onmessage = (event) => {
        const message = parseNotificationMessage(event.data)
        if (message) {
          this.handleMessage(message)
        }
      }

      socket.onclose = () => {
        if (!this.enabled) return
        this.attemptReconnect()
      }

      socket.onerror = (error) => {
        console.error('Notification stream error:', error)
      }
    } catch (error) {
      console.error('Failed to open notification stream:', error)
    } finally {
      this.connecting = false
    }
  }

  private attemptReconnect () {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++
      setTimeout(() => this.connect(), this.reconnectInterval)
    }
  }

  private handleMessage (message: NotificationMessage) {
    if (message.type === NotificationMessageType.SubmissionResult) {
      const { solutionId, judgeStatus } = message.data
      this.messageService.info(
        this.t('ptoj.submission_result'),
        this.t('ptoj.submission_result_detail', {
          solutionId,
          judgeStatus: judgeStatusLabels[judgeStatus],
        }),
      )
      emitter.emit('submission-updated', solutionId)
    } else if (message.type === NotificationMessageType.Notification) {
      const { title, content, severity, life } = message.data
      this.messageService.notify(severity, title, content, life)
    }
  }

  disconnect () {
    this.enabled = false
    if (this.socket) {
      this.socket.close()
      this.socket = null
    }
  }

  connected (): boolean {
    return this.socket?.readyState === WebSocket.OPEN
  }
}

let instance: NotificationService | null = null

export function useNotification () {
  if (!instance) {
    instance = new NotificationService()
  }
  return instance
}
