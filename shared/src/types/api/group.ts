import { z } from 'zod'
import { GroupModelSchema } from '../model/group.js'

export const GroupListQueryResultSchema = z.array(z.object({
  gid: GroupModelSchema.shape.gid,
  title: GroupModelSchema.shape.title,
}))

export type GroupListQueryResult = z.input<typeof GroupListQueryResultSchema>
