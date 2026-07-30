import { z } from 'zod'
import { PostFieldsSchema } from '../fields/index.js'
import { PaginatedResultSchema, PaginationSchema } from './utils.js'

export const PostListQuerySchema = z.object({
  page: PaginationSchema.shape.page,
  pageSize: PaginationSchema.shape.pageSize.default(10),
})

export type PostListQuery = z.infer<typeof PostListQuerySchema>

export const PostListQueryResultSchema = PaginatedResultSchema(z.object({
  id: PostFieldsSchema.shape.id,
  slug: PostFieldsSchema.shape.slug,
  title: PostFieldsSchema.shape.title,
  publishesAt: PostFieldsSchema.shape.publishesAt,
  isPinned: PostFieldsSchema.shape.isPinned,
}))

export type PostListQueryResult = z.input<typeof PostListQueryResultSchema>

export const PostDetailQueryResultSchema = z.object({
  slug: PostFieldsSchema.shape.slug,
  title: PostFieldsSchema.shape.title,
  content: PostFieldsSchema.shape.content,
  publishesAt: PostFieldsSchema.shape.publishesAt,
  isPinned: PostFieldsSchema.shape.isPinned,
  isHidden: PostFieldsSchema.shape.isHidden,
})

export type PostDetailQueryResult = z.input<typeof PostDetailQueryResultSchema>
