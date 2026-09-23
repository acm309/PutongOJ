import { z } from 'zod'
import { GroupModelSchema } from '../model/group.js'

export const GroupListQueryResultSchema = z.array(z.object({
  id: GroupModelSchema.shape.id,
  title: GroupModelSchema.shape.title,
}))

export type GroupListQueryResult = z.input<typeof GroupListQueryResultSchema>
