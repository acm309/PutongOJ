import { z } from 'zod'
import { DiscussionType } from '@/consts/index.js'
import { stringToInt } from '../codec.js'
import {
  CommentModelSchema,
  ContestModelSchema,
  DiscussionModelSchema,
  ProblemModelSchema,
  UserModelSchema,
} from '../model/index.js'
import { PaginatedSchema, PaginationSchema, SortOptionSchema } from './utils.js'

export const DiscussionListQuerySchema = z.object({
  page: PaginationSchema.shape.page,
  pageSize: PaginationSchema.shape.pageSize.default(30),
  sort: SortOptionSchema.shape.sort,
  sortBy: z.enum(['createdAt', 'lastCommentAt', 'comments']).default('lastCommentAt'),
  author: UserModelSchema.shape.uid.optional(),
  type: stringToInt.pipe(z.enum(DiscussionType)).optional(),
})

export type DiscussionListQuery = z.infer<typeof DiscussionListQuerySchema>

export const DiscussionListQueryResultSchema = PaginatedSchema(z.object({
  discussionId: DiscussionModelSchema.shape.discussionId,
  author: z.object({
    uid: UserModelSchema.shape.uid,
  }),
  type: DiscussionModelSchema.shape.type,
  title: DiscussionModelSchema.shape.title,
  comments: DiscussionModelSchema.shape.comments,
  lastCommentAt: DiscussionModelSchema.shape.lastCommentAt,
  createdAt: DiscussionModelSchema.shape.createdAt,
}))

export type DiscussionListQueryResult = z.input<typeof DiscussionListQueryResultSchema>

export const DiscussionDetailQueryResultSchema = z.object({
  discussionId: DiscussionModelSchema.shape.discussionId,
  author: z.object({
    uid: UserModelSchema.shape.uid,
  }),
  problem: z.object({
    pid: ProblemModelSchema.shape.pid,
  }).nullable(),
  contest: z.object({
    cid: ContestModelSchema.shape.cid,
  }).nullable(),
  type: DiscussionModelSchema.shape.type,
  title: DiscussionModelSchema.shape.title,
  comments: z.array(z.object({
    commentId: CommentModelSchema.shape.commentId,
    author: z.object({
      uid: UserModelSchema.shape.uid,
      nick: UserModelSchema.shape.nick,
      avatar: UserModelSchema.shape.avatar,
    }),
    content: CommentModelSchema.shape.content,
    createdAt: CommentModelSchema.shape.createdAt,
    updatedAt: CommentModelSchema.shape.updatedAt,
  })),
  createdAt: DiscussionModelSchema.shape.createdAt,
  updatedAt: DiscussionModelSchema.shape.updatedAt,
})

export type DiscussionDetailQueryResult = z.input<typeof DiscussionDetailQueryResultSchema>

export const DiscussionCreatePayloadSchema = z.object({
  type: z.enum(DiscussionType).exclude(['ArchivedDiscussion']),
  title: DiscussionModelSchema.shape.title,
  problem: ProblemModelSchema.shape.pid.optional(),
  contest: ContestModelSchema.shape.cid.optional(),
  content: CommentModelSchema.shape.content,
})

export type DiscussionCreatePayload = z.infer<typeof DiscussionCreatePayloadSchema>

export const CommentCreatePayloadSchema = z.object({
  content: CommentModelSchema.shape.content,
})

export type CommentCreatePayload = z.infer<typeof CommentCreatePayloadSchema>
