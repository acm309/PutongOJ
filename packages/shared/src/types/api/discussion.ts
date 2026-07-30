import { z } from 'zod'
import { DiscussionType } from '@/consts/index.js'
import {
  CommentModelSchema,
  ContestModelSchema,
  DiscussionModelSchema,
  ProblemModelSchema,
  UserModelSchema,
} from '../model/index.js'
import { PaginatedResultSchema, PaginationSchema, SortOptionSchema } from './utils.js'

export const DiscussionListQuerySchema = z.object({
  page: PaginationSchema.shape.page,
  pageSize: PaginationSchema.shape.pageSize.default(10),
  sort: SortOptionSchema.shape.sort,
  sortBy: z.enum(['createdAt', 'lastCommentAt', 'comments']).default('lastCommentAt'),
  authorId: z.coerce.number().int().positive().optional(),
  type: DiscussionModelSchema.shape.type.optional(),
})

export type DiscussionListQuery = z.infer<typeof DiscussionListQuerySchema>

export const DiscussionListQueryResultSchema = PaginatedResultSchema(z.object({
  id: DiscussionModelSchema.shape.id,
  author: z.object({
    id: UserModelSchema.shape.id,
    username: UserModelSchema.shape.username,
    avatarUrl: UserModelSchema.shape.avatarUrl,
  }),
  problem: z.object({
    id: ProblemModelSchema.shape.id,
  }).nullable(),
  contest: z.object({
    id: ContestModelSchema.shape.id,
  }).nullable(),
  type: DiscussionModelSchema.shape.type,
  isPinned: DiscussionModelSchema.shape.isPinned,
  title: DiscussionModelSchema.shape.title,
  comments: DiscussionModelSchema.shape.comments,
  lastCommentAt: DiscussionModelSchema.shape.lastCommentAt,
  createdAt: DiscussionModelSchema.shape.createdAt,
}))

export type DiscussionListQueryResult = z.input<typeof DiscussionListQueryResultSchema>

export const DiscussionDetailQueryResultSchema = z.object({
  id: DiscussionModelSchema.shape.id,
  author: z.object({
    id: UserModelSchema.shape.id,
    username: UserModelSchema.shape.username,
  }),
  problem: z.object({
    id: ProblemModelSchema.shape.id,
  }).nullable(),
  contest: z.object({
    id: ContestModelSchema.shape.id,
  }).nullable(),
  type: DiscussionModelSchema.shape.type,
  isPinned: DiscussionModelSchema.shape.isPinned,
  title: DiscussionModelSchema.shape.title,
  comments: z.array(z.object({
    id: CommentModelSchema.shape.id,
    author: z.object({
      id: UserModelSchema.shape.id,
      username: UserModelSchema.shape.username,
      nickname: UserModelSchema.shape.nickname,
      avatarUrl: UserModelSchema.shape.avatarUrl,
    }),
    content: CommentModelSchema.shape.content,
    createdAt: CommentModelSchema.shape.createdAt,
    updatedAt: CommentModelSchema.shape.updatedAt,
  })),
  isJury: z.boolean(),
  createdAt: DiscussionModelSchema.shape.createdAt,
  updatedAt: DiscussionModelSchema.shape.updatedAt,
})

export type DiscussionDetailQueryResult = z.input<typeof DiscussionDetailQueryResultSchema>

export const DiscussionCreatePayloadSchema = z.object({
  type: DiscussionModelSchema.shape.type.exclude([DiscussionType.ARCHIVED_DISCUSSION]),
  title: DiscussionModelSchema.shape.title,
  problemId: ProblemModelSchema.shape.id.optional(),
  contestId: ContestModelSchema.shape.id.optional(),
  content: CommentModelSchema.shape.content,
})

export type DiscussionCreatePayload = z.infer<typeof DiscussionCreatePayloadSchema>

export const CommentCreatePayloadSchema = z.object({
  content: CommentModelSchema.shape.content,
})

export type CommentCreatePayload = z.infer<typeof CommentCreatePayloadSchema>
