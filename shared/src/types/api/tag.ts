import { z } from 'zod'
import { TagModelSchema } from '../model/tag.js'

export const TagListQueryResultSchema = z.array(z.object({
  tagId: TagModelSchema.shape.tagId,
  name: TagModelSchema.shape.name,
  color: TagModelSchema.shape.color,
}))

export type TagListQueryResult = z.input<typeof TagListQueryResultSchema>
