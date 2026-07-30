import { z } from 'zod'
import { DiscussionType, TITLE_LENGTH_MAX } from '@/consts/index.js'
import { isoDatetimeToDate } from '../codec.js'

export const DiscussionModelSchema = z.object({
  id: z.int().positive(),
  authorId: z.int().positive(),
  problemId: z.int().positive().nullable(),
  contestId: z.int().positive().nullable(),
  type: z.enum(DiscussionType),
  isPinned: z.boolean(),
  title: z.string().min(1).max(TITLE_LENGTH_MAX),
  comments: z.int().nonnegative(),
  lastCommentAt: isoDatetimeToDate,
  createdAt: isoDatetimeToDate,
  updatedAt: isoDatetimeToDate,
})

export type DiscussionModel = z.infer<typeof DiscussionModelSchema>
