import { z } from 'zod'
import { TagColor } from '@/consts/index.js'
import { isoDatetimeToDate } from '../codec.js'

export const TagFieldsSchema = z.object({
  id: z.int().positive(),
  name: z.string().min(1).max(29),
  color: z.enum(TagColor),
  createdAt: isoDatetimeToDate,
  updatedAt: isoDatetimeToDate,
})
