import { z } from 'zod'
import { COMMENT_LENGTH_MAX } from '@/consts/index.js'
import { isoDatetimeToDate } from '../codec.js'

export const CommentFieldsSchema = z.object({
  id: z.int().positive(),
  discussionId: z.int().positive(),
  authorId: z.int().positive(),
  content: z.string().min(1).max(COMMENT_LENGTH_MAX),
  isHidden: z.boolean(),
  createdAt: isoDatetimeToDate,
  updatedAt: isoDatetimeToDate,
})
