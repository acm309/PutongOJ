import { z } from 'zod'
import { TagFieldsSchema } from '../fields/tag.js'

export const TagListQueryResultSchema = z.array(z.object({
  id: TagFieldsSchema.shape.id,
  name: TagFieldsSchema.shape.name,
  color: TagFieldsSchema.shape.color,
}))

export type TagListQueryResult = z.input<typeof TagListQueryResultSchema>
