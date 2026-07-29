import { z } from 'zod'
import { COMMENT_LENGTH_MAX } from '@/consts/index.js'
import { isoDatetimeToDate } from '../codec.js'
import { ObjectIdSchema } from '../utils.js'

export const CommentModelSchema = z.object({
  commentId: z.int().nonnegative(),
  discussion: ObjectIdSchema,
  author: ObjectIdSchema,
  content: z.string().min(1).max(COMMENT_LENGTH_MAX),
  hidden: z.boolean(),
  createdAt: isoDatetimeToDate,
  updatedAt: isoDatetimeToDate,
})

export type CommentModel = z.infer<typeof CommentModelSchema>
