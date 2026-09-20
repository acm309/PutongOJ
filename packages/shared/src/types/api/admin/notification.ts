import { z } from 'zod'

export const AdminNotificationCreatePayloadSchema = z.object({
  title: z.string().min(1).max(30),
  content: z.string().min(1).max(300),
})

export type AdminNotificationCreatePayload = z.infer<typeof AdminNotificationCreatePayloadSchema>
