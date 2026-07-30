import { z } from 'zod'
import { GroupModelSchema } from '../model/group.js'

export const GroupListQueryResultSchema = z.array(z.object({
  id: GroupModelSchema.shape.id,
  name: GroupModelSchema.shape.name,
}))

export type GroupListQueryResult = z.input<typeof GroupListQueryResultSchema>
