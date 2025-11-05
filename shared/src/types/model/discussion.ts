import { z } from 'zod'
import { COMMENT_LENGTH_MAX, DiscussionType, TITLE_LENGTH_MAX } from '@/consts/index.js'
import { isoDatetimeToDate } from '../codec.js'
import { ObjectIdSchema } from '../utils.js'
import { UserModelSchema } from './user.js'

const DiscussionCommentSchema = z.object({
  user: z.lazy(() => UserModelSchema),
  content: z.string().min(1).max(COMMENT_LENGTH_MAX),
  createdAt: isoDatetimeToDate,
  updatedAt: isoDatetimeToDate,
})

export const DiscussionModelSchema = z.object({
  discussionId: z.int().nonnegative(),
  user: z.lazy(() => UserModelSchema),
  problem: ObjectIdSchema.nullable(), // TODO
  contest: ObjectIdSchema.nullable(), // TODO
  type: z.enum(DiscussionType),
  title: z.string().min(1).max(TITLE_LENGTH_MAX),
  comments: z.array(DiscussionCommentSchema),
  createdAt: isoDatetimeToDate,
  updatedAt: isoDatetimeToDate,
})

export type DiscussionModel = z.infer<typeof DiscussionModelSchema>
