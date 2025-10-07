import { z } from 'zod'
import { isoDatetimeToDate } from '../codec.js'

export const GroupModelSchema = z.object({
  gid: z.number().int().nonnegative(),
  title: z.string().min(4).max(79),
  createdAt: isoDatetimeToDate,
  updatedAt: isoDatetimeToDate,
})

export type GroupModel = z.infer<typeof GroupModelSchema>
