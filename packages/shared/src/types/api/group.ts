import { z } from 'zod'
import { GroupFieldsSchema } from '../fields/group.js'

export const GroupListQueryResultSchema = z.array(z.object({
  id: GroupFieldsSchema.shape.id,
  name: GroupFieldsSchema.shape.name,
}))

export type GroupListQueryResult = z.input<typeof GroupListQueryResultSchema>
