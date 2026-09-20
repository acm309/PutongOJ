import { z } from 'zod'
import { TagModelSchema } from '../../model/index.js'

export const AdminTagListQueryResultSchema = z.array(TagModelSchema)

export type AdminTagListQueryResult = z.input<typeof AdminTagListQueryResultSchema>

export const AdminTagCreatePayloadSchema = z.object({
  name: TagModelSchema.shape.name,
  color: TagModelSchema.shape.color,
})

export type AdminTagCreatePayload = z.infer<typeof AdminTagCreatePayloadSchema>

export const AdminTagUpdatePayloadSchema = z.object({
  name: TagModelSchema.shape.name.optional(),
  color: TagModelSchema.shape.color.optional(),
})

export type AdminTagUpdatePayload = z.infer<typeof AdminTagUpdatePayloadSchema>
