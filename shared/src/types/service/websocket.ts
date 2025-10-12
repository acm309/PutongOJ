import type { JudgeStatus } from '@/consts/index.js'

export enum WebSocketMessageType {
  Connect = 'connect',
  Notification = 'notification',
  SubmissionResult = 'submission_result',
}

type WebSocketMessageConnect = {
  type: WebSocketMessageType.Connect
  data: {
    username: string
    message: string
  }
}

type WebSocketMessageNotification = {
  type: WebSocketMessageType.Notification
  data: {
    title: string
    content: string
  }
}

type WebSocketMessageSubmissionResult = {
  type: WebSocketMessageType.SubmissionResult
  data: {
    solutionId: number
    judgeStatus: JudgeStatus
  }
}

export type WebSocketMessage
  = WebSocketMessageConnect
    | WebSocketMessageNotification
    | WebSocketMessageSubmissionResult

export enum WebSocketDispatchType {
  User = 'user',
  Broadcast = 'broadcast',
}

type WebSocketDispatchUser = {
  type: WebSocketDispatchType.User
  username: string
  message: WebSocketMessage
}

type WebSocketDispatchBroadcast = {
  type: WebSocketDispatchType.Broadcast
  message: WebSocketMessage
}

export type WebSocketDispatch
  = WebSocketDispatchUser
    | WebSocketDispatchBroadcast
