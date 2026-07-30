import { z } from 'zod'
import { DiscussionType } from '@/consts/index.js'
import {
  CommentFieldsSchema,
  ContestFieldsSchema,
  DiscussionFieldsSchema,
  ProblemFieldsSchema,
  UserFieldsSchema,
} from '../fields/index.js'
import { PaginatedResultSchema, PaginationSchema, SortOptionSchema } from './utils.js'

export const DiscussionListQuerySchema = z.object({
  page: PaginationSchema.shape.page,
  pageSize: PaginationSchema.shape.pageSize.default(10),
  sort: SortOptionSchema.shape.sort,
  sortBy: z.enum(['createdAt', 'lastCommentAt', 'comments']).default('lastCommentAt'),
  authorId: z.coerce.number().int().positive().optional(),
  type: DiscussionFieldsSchema.shape.type.optional(),
})

export type DiscussionListQuery = z.infer<typeof DiscussionListQuerySchema>

export const DiscussionListQueryResultSchema = PaginatedResultSchema(z.object({
  id: DiscussionFieldsSchema.shape.id,
  author: z.object({
    id: UserFieldsSchema.shape.id,
    username: UserFieldsSchema.shape.username,
    avatarUrl: UserFieldsSchema.shape.avatarUrl,
  }),
  problem: z.object({
    id: ProblemFieldsSchema.shape.id,
  }).nullable(),
  contest: z.object({
    id: ContestFieldsSchema.shape.id,
  }).nullable(),
  type: DiscussionFieldsSchema.shape.type,
  isPinned: DiscussionFieldsSchema.shape.isPinned,
  title: DiscussionFieldsSchema.shape.title,
  comments: DiscussionFieldsSchema.shape.comments,
  lastCommentAt: DiscussionFieldsSchema.shape.lastCommentAt,
  createdAt: DiscussionFieldsSchema.shape.createdAt,
}))

export type DiscussionListQueryResult = z.input<typeof DiscussionListQueryResultSchema>

export const DiscussionDetailQueryResultSchema = z.object({
  id: DiscussionFieldsSchema.shape.id,
  author: z.object({
    id: UserFieldsSchema.shape.id,
    username: UserFieldsSchema.shape.username,
  }),
  problem: z.object({
    id: ProblemFieldsSchema.shape.id,
  }).nullable(),
  contest: z.object({
    id: ContestFieldsSchema.shape.id,
  }).nullable(),
  type: DiscussionFieldsSchema.shape.type,
  isPinned: DiscussionFieldsSchema.shape.isPinned,
  title: DiscussionFieldsSchema.shape.title,
  comments: z.array(z.object({
    id: CommentFieldsSchema.shape.id,
    author: z.object({
      id: UserFieldsSchema.shape.id,
      username: UserFieldsSchema.shape.username,
      nickname: UserFieldsSchema.shape.nickname,
      avatarUrl: UserFieldsSchema.shape.avatarUrl,
    }),
    content: CommentFieldsSchema.shape.content,
    createdAt: CommentFieldsSchema.shape.createdAt,
    updatedAt: CommentFieldsSchema.shape.updatedAt,
  })),
  isJury: z.boolean(),
  createdAt: DiscussionFieldsSchema.shape.createdAt,
  updatedAt: DiscussionFieldsSchema.shape.updatedAt,
})

export type DiscussionDetailQueryResult = z.input<typeof DiscussionDetailQueryResultSchema>

export const DiscussionCreatePayloadSchema = z.object({
  type: DiscussionFieldsSchema.shape.type.exclude([DiscussionType.ARCHIVED_DISCUSSION]),
  title: DiscussionFieldsSchema.shape.title,
  problemId: ProblemFieldsSchema.shape.id.optional(),
  contestId: ContestFieldsSchema.shape.id.optional(),
  content: CommentFieldsSchema.shape.content,
})

export type DiscussionCreatePayload = z.infer<typeof DiscussionCreatePayloadSchema>

export const DiscussionCreateResultSchema = z.object({
  id: DiscussionFieldsSchema.shape.id,
})

export type DiscussionCreateResult = z.input<typeof DiscussionCreateResultSchema>

export const CommentCreatePayloadSchema = z.object({
  content: CommentFieldsSchema.shape.content,
})

export type CommentCreatePayload = z.infer<typeof CommentCreatePayloadSchema>
