import { z } from 'zod'
import { PostModelSchema } from '../model/index.js'
import { PaginatedSchema, PaginationSchema } from './utils.js'

export const PostListQuerySchema = z.object({
  page: PaginationSchema.shape.page,
  pageSize: PaginationSchema.shape.pageSize.default(10),
})

export type PostListQuery = z.infer<typeof PostListQuerySchema>

export const PostListQueryResultSchema = PaginatedSchema(z.object({
  slug: PostModelSchema.shape.slug,
  title: PostModelSchema.shape.title,
  publishesAt: PostModelSchema.shape.publishesAt,
  isPinned: PostModelSchema.shape.isPinned,
}))

export type PostListQueryResult = z.input<typeof PostListQueryResultSchema>

export const PostDetailQueryResultSchema = z.object({
  slug: PostModelSchema.shape.slug,
  title: PostModelSchema.shape.title,
  content: PostModelSchema.shape.content,
  publishesAt: PostModelSchema.shape.publishesAt,
  isPinned: PostModelSchema.shape.isPinned,
  isHidden: PostModelSchema.shape.isHidden,
})

export type PostDetailQueryResult = z.input<typeof PostDetailQueryResultSchema>
