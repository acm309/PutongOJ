import { z } from 'zod'
import { TITLE_LENGTH_MAX } from '@/consts/index.js'
import { isoDatetimeToDate } from '../codec.js'

export const PostFieldsSchema = z.object({
  id: z.int().positive(),
  slug: z.string().min(1).max(100),
  title: z.string().min(1).max(TITLE_LENGTH_MAX),
  content: z.string(),
  publishesAt: isoDatetimeToDate,
  isPublished: z.boolean(),
  isPinned: z.boolean(),
  isHidden: z.boolean(),
  createdAt: isoDatetimeToDate,
  updatedAt: isoDatetimeToDate,
})
