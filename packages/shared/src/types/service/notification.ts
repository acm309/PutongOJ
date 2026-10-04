import { z } from 'zod'
import { JudgeStatus } from '@/consts/index.js'
import { ObjectIdStringSchema } from '@/types/utils.js'

export const NotificationSeveritySchema = z.enum([
  'info',
  'success',
  'warn',
  'error',
])
export type NotificationSeverity = z.infer<typeof NotificationSeveritySchema>

export enum NotificationMessageType {
  Connect = 'connect',
  Notification = 'notification',
  SubmissionResult = 'submission_result',
}

export const NotificationConnectMessageSchema = z.object({
  type: z.literal(NotificationMessageType.Connect),
  data: z.object({
    userId: ObjectIdStringSchema,
    message: z.string(),
  }),
})

export const NotificationNoticeMessageSchema = z.object({
  type: z.literal(NotificationMessageType.Notification),
  data: z.object({
    title: z.string(),
    content: z.string(),
    severity: NotificationSeveritySchema,
    life: z.number().nullable(),
  }),
})

export const NotificationSubmissionResultMessageSchema = z.object({
  type: z.literal(NotificationMessageType.SubmissionResult),
  data: z.object({
    solutionId: z.int().nonnegative(),
    judgeStatus: z.enum(JudgeStatus),
  }),
})

export const NotificationMessageSchema = z.discriminatedUnion('type', [
  NotificationConnectMessageSchema,
  NotificationNoticeMessageSchema,
  NotificationSubmissionResultMessageSchema,
])

export type NotificationMessage = z.infer<typeof NotificationMessageSchema>

export enum NotificationDispatchType {
  User = 'user',
  Broadcast = 'broadcast',
}

export const NotificationUserDispatchSchema = z.object({
  type: z.literal(NotificationDispatchType.User),
  userId: ObjectIdStringSchema,
  message: NotificationMessageSchema,
})

export const NotificationBroadcastDispatchSchema = z.object({
  type: z.literal(NotificationDispatchType.Broadcast),
  message: NotificationMessageSchema,
})

export const NotificationDispatchSchema = z.discriminatedUnion('type', [
  NotificationUserDispatchSchema,
  NotificationBroadcastDispatchSchema,
])

export type NotificationDispatch = z.infer<typeof NotificationDispatchSchema>
