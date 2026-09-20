import { z } from 'zod'
import { DiscussionType } from '@/consts/index.js'
import {
  CommentModelSchema,
  ContestModelSchema,
  DiscussionModelSchema,
  ProblemModelSchema,
  UserModelSchema,
} from '../../model/index.js'

export const AdminDiscussionUpdatePayloadSchema = z.object({
  author: UserModelSchema.shape.uid.optional(),
  problem: ProblemModelSchema.shape.pid.nullable().optional(),
  contest: ContestModelSchema.shape.contestId.nullable().optional(),
  type: z.enum(DiscussionType).optional(),
  pinned: DiscussionModelSchema.shape.pinned.optional(),
  title: DiscussionModelSchema.shape.title.optional(),
})

export type AdminDiscussionUpdatePayload = z.infer<typeof AdminDiscussionUpdatePayloadSchema>

export const AdminCommentUpdatePayloadSchema = z.object({
  hidden: CommentModelSchema.shape.hidden.optional(),
})

export type AdminCommentUpdatePayload = z.infer<typeof AdminCommentUpdatePayloadSchema>
