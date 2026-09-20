import { z } from 'zod'
import { TITLE_LENGTH_MAX } from '@/consts/index.js'
import { PostModelSchema } from '../../model/index.js'
import {
  PaginatedSchema,
  PaginationSchema,
  SortOptionSchema,
} from '../utils.js'

export const AdminPostListQuerySchema = z.object({
  page: PaginationSchema.shape.page,
  pageSize: PaginationSchema.shape.pageSize.default(30),
  sort: SortOptionSchema.shape.sort,
  sortBy: z.enum([ 'publishesAt', 'createdAt', 'updatedAt' ]).default('publishesAt'),
  title: z.string().max(TITLE_LENGTH_MAX).optional(),
  isPublished: z.stringbool().optional(),
  isPinned: z.stringbool().optional(),
  isHidden: z.stringbool().optional(),
})

export type AdminPostListQuery = z.infer<typeof AdminPostListQuerySchema>

export const AdminPostListQueryResultSchema = PaginatedSchema(z.object({
  slug: PostModelSchema.shape.slug,
  title: PostModelSchema.shape.title,
  publishesAt: PostModelSchema.shape.publishesAt,
  isPublished: PostModelSchema.shape.isPublished,
  isPinned: PostModelSchema.shape.isPinned,
  isHidden: PostModelSchema.shape.isHidden,
  createdAt: PostModelSchema.shape.createdAt,
  updatedAt: PostModelSchema.shape.updatedAt,
}))

export type AdminPostListQueryResult = z.input<typeof AdminPostListQueryResultSchema>

export const AdminPostDetailQueryResultSchema = z.object({
  slug: PostModelSchema.shape.slug,
  title: PostModelSchema.shape.title,
  content: PostModelSchema.shape.content,
  publishesAt: PostModelSchema.shape.publishesAt,
  isPublished: PostModelSchema.shape.isPublished,
  isPinned: PostModelSchema.shape.isPinned,
  isHidden: PostModelSchema.shape.isHidden,
  createdAt: PostModelSchema.shape.createdAt,
  updatedAt: PostModelSchema.shape.updatedAt,
})

export type AdminPostDetailQueryResult = z.input<typeof AdminPostDetailQueryResultSchema>

export const AdminPostCreatePayloadSchema = z.object({
  title: PostModelSchema.shape.title,
})

export type AdminPostCreatePayload = z.infer<typeof AdminPostCreatePayloadSchema>

export const AdminPostUpdatePayloadSchema = z.object({
  slug: PostModelSchema.shape.slug.optional(),
  title: PostModelSchema.shape.title.optional(),
  content: PostModelSchema.shape.content.optional(),
  publishesAt: PostModelSchema.shape.publishesAt.optional(),
  isPublished: PostModelSchema.shape.isPublished.optional(),
  isPinned: PostModelSchema.shape.isPinned.optional(),
  isHidden: PostModelSchema.shape.isHidden.optional(),
})

export type AdminPostUpdatePayload = z.infer<typeof AdminPostUpdatePayloadSchema>
