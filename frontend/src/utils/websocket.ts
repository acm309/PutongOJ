import type { WebSocketMessage } from '@putongoj/shared'
import type { MessageService } from './message'
import { WebSocketMessageType } from '@putongoj/shared'
import { useI18n } from 'vue-i18n'
import { getWebSocketToken } from '@/api/utils'
import { judgeStatusLabels } from './constant'
import emitter from './emitter'
import { useMessage } from './message'

class WebSocketService {
  private ws: WebSocket | null = null
  private enable = false
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectInterval = 3000
  private messageService: MessageService
  private t: ReturnType<typeof useI18n>['t']

  constructor () {
    this.t = useI18n().t
    this.messageService = useMessage()
  }

  async connect (): Promise<void> {
    this.enable = true
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      return
    }

    try {
      const resp = await getWebSocketToken()
      if (!resp.success) {
        console.error('Failed to get WebSocket token')
        return
      }

      this.ws = new WebSocket(`/ws?token=${resp.data.token}`)

      this.ws.onopen = () => {
        this.reconnectAttempts = 0
      }

      this.ws.onmessage = (event) => {
        const message: WebSocketMessage = JSON.parse(event.data)
        this.handleMessage(message)
      }

      this.ws.onclose = () => {
        if (!this.enable) return
        this.attemptReconnect()
      }

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error)
      }
    } catch (error) {
      console.error('Failed to get WebSocket token:', error)
    }
  }

  private attemptReconnect () {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++
      setTimeout(() => this.connect(), this.reconnectInterval)
    }
  }

  private handleMessage (message: WebSocketMessage) {
    if (message.type === WebSocketMessageType.SubmissionResult) {
      const { solutionId, judgeStatus } = message.data
      this.messageService.info(
        this.t('ptoj.submission_result'),
        this.t('ptoj.submission_result_detail', {
          solutionId,
          judgeStatus: judgeStatusLabels[judgeStatus],
        }),
      )
      emitter.emit('submission-updated', solutionId)
    } else if (message.type === WebSocketMessageType.Notification) {
      const { title, content } = message.data
      this.messageService.info(title, content)
    }
  }

  disconnect () {
    this.enable = false
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
  }

  connected (): boolean {
    return this.ws?.readyState === WebSocket.OPEN
  }
}

let instance: WebSocketService | null = null

export function useWebSocket () {
  if (!instance) {
    instance = new WebSocketService()
  }
  return instance
}
