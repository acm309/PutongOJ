import { z } from 'zod'
import { DiscussionType } from '@/consts/index.js'
import { stringToInt } from '../codec.js'
import {
  ContestModelSchema,
  DiscussionCommentModelSchema,
  DiscussionModelSchema,
  ProblemModelSchema,
  UserModelSchema,
} from '../model/index.js'
import { PaginatedSchema, PaginationSchema, SortOptionSchema } from './utils.js'

export const DiscussionListQuerySchema = z.object({
  page: PaginationSchema.shape.page,
  pageSize: PaginationSchema.shape.pageSize.default(30),
  sort: SortOptionSchema.shape.sort,
  sortBy: z.enum(['createdAt', 'updatedAt']).default('updatedAt'),
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
  createdAt: DiscussionModelSchema.shape.createdAt,
  updatedAt: DiscussionModelSchema.shape.updatedAt,
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
    user: z.object({
      uid: UserModelSchema.shape.uid,
      nick: UserModelSchema.shape.nick,
    }),
    content: DiscussionCommentModelSchema.shape.content,
    createdAt: DiscussionCommentModelSchema.shape.createdAt,
    updatedAt: DiscussionCommentModelSchema.shape.updatedAt,
  })),
  createdAt: DiscussionModelSchema.shape.createdAt,
  updatedAt: DiscussionModelSchema.shape.updatedAt,
})

export type DiscussionDetailQueryResult = z.input<typeof DiscussionDetailQueryResultSchema>
