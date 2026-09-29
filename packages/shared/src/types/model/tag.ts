import { z } from 'zod'
import { tagColors } from '@/consts/index.js'
import { isoDatetimeToDate } from '../codec.js'
import { ObjectIdStringSchema } from '../utils.js'

export const TagModelSchema = z.object({
  id: ObjectIdStringSchema,
  name: z.string().min(1).max(30),
  color: z.enum(tagColors),
  createdAt: isoDatetimeToDate,
  updatedAt: isoDatetimeToDate,
})

export type TagModel = z.infer<typeof TagModelSchema>
