import { z } from 'zod'
import { DiscussionType, TITLE_LENGTH_MAX } from '@/consts/index.js'
import { isoDatetimeToDate } from '../codec.js'
import { ObjectIdSchema } from '../utils.js'

export const DiscussionModelSchema = z.object({
  discussionId: z.int().nonnegative(),
  author: ObjectIdSchema,
  problem: ObjectIdSchema.nullable(),
  contest: ObjectIdSchema.nullable(),
  type: z.enum(DiscussionType),
  title: z.string().min(1).max(TITLE_LENGTH_MAX),
  comments: z.int().nonnegative(),
  lastCommentAt: isoDatetimeToDate,
  createdAt: isoDatetimeToDate,
  updatedAt: isoDatetimeToDate,
})

export type DiscussionModel = z.infer<typeof DiscussionModelSchema>
