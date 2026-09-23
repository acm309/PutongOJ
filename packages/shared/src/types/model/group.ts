import { z } from 'zod'
import { isoDatetimeToDate } from '../codec.js'
import { ObjectIdStringSchema } from '../utils.js'

export const GroupModelSchema = z.object({
  id: ObjectIdStringSchema,
  title: z.string().min(4).max(79),
  createdAt: isoDatetimeToDate,
  updatedAt: isoDatetimeToDate,
})

export type GroupModel = z.infer<typeof GroupModelSchema>
