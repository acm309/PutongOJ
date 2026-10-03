import { z } from 'zod'

export const NotificationSeveritySchema = z.enum([
  'info',
  'success',
  'warn',
  'error',
])
export type NotificationSeverity = z.infer<typeof NotificationSeveritySchema>

export const AdminNotificationCreatePayloadSchema = z.object({
  title: z.string().min(1).max(30),
  content: z.string().min(1).max(300),
  severity: NotificationSeveritySchema.default('info'),
  duration: z.number().positive().nullable().default(10),
})

export type AdminNotificationCreatePayload = z.infer<typeof AdminNotificationCreatePayloadSchema>
