import { z } from 'zod'
import { GroupModelSchema, UserModelSchema } from '../../model/index.js'

export const AdminGroupDetailQueryResultSchema = z.object({
  id: GroupModelSchema.shape.id,
  name: GroupModelSchema.shape.title,
  members: z.array(UserModelSchema.shape.uid),
})

export type AdminGroupDetailQueryResult = z.input<typeof AdminGroupDetailQueryResultSchema>

export const AdminGroupCreatePayloadSchema = z.object({
  name: GroupModelSchema.shape.title,
})

export type AdminGroupCreatePayload = z.infer<typeof AdminGroupCreatePayloadSchema>

export const AdminGroupUpdatePayloadSchema = z.object({
  name: GroupModelSchema.shape.title,
})

export type AdminGroupUpdatePayload = z.infer<typeof AdminGroupUpdatePayloadSchema>

export const AdminGroupMembersUpdatePayloadSchema = z.object({
  members: z.array(UserModelSchema.shape.uid),
})

export type AdminGroupMembersUpdatePayload = z.infer<typeof AdminGroupMembersUpdatePayloadSchema>
