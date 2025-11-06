import { z } from 'zod'
import { COMMENT_LENGTH_MAX, DiscussionType, TITLE_LENGTH_MAX } from '@/consts/index.js'
import { isoDatetimeToDate } from '../codec.js'
import { ObjectIdSchema } from '../utils.js'

export const DiscussionCommentModelSchema = z.object({
  user: ObjectIdSchema,
  content: z.string().min(1).max(COMMENT_LENGTH_MAX),
  createdAt: isoDatetimeToDate,
  updatedAt: isoDatetimeToDate,
})

export const DiscussionModelSchema = z.object({
  discussionId: z.int().nonnegative(),
  author: ObjectIdSchema,
  problem: ObjectIdSchema.nullable(),
  contest: ObjectIdSchema.nullable(),
  type: z.enum(DiscussionType),
  title: z.string().min(1).max(TITLE_LENGTH_MAX),
  comments: z.array(DiscussionCommentModelSchema),
  createdAt: isoDatetimeToDate,
  updatedAt: isoDatetimeToDate,
})

export type DiscussionModel = z.infer<typeof DiscussionModelSchema>
