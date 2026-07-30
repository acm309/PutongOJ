import { z } from 'zod'
import { TagColor } from '@/consts/index.js'
import { isoDatetimeToDate } from '../codec.js'

export const TagModelSchema = z.object({
  id: z.int().positive(),
  name: z.string().min(1).max(30),
  color: z.enum(TagColor),
  createdAt: isoDatetimeToDate,
  updatedAt: isoDatetimeToDate,
})

export type TagModel = z.infer<typeof TagModelSchema>
