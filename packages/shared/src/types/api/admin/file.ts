import { z } from 'zod'
import { FileModelSchema, UserModelSchema } from '../../model/index.js'
import {
  PaginatedSchema,
  PaginationSchema,
  SortOptionSchema,
} from '../utils.js'

export const AdminFileListQuerySchema = z.object({
  page: PaginationSchema.shape.page,
  pageSize: PaginationSchema.shape.pageSize.default(30),
  sort: SortOptionSchema.shape.sort,
  sortBy: z.enum([ 'createdAt', 'sizeBytes' ]).default('createdAt'),
  uploader: UserModelSchema.shape.uid.optional(),
})

export type AdminFileListQuery = z.infer<typeof AdminFileListQuerySchema>

export const AdminFileListQueryResultSchema = PaginatedSchema(z.object({
  owner: UserModelSchema.shape.uid,
  storageKey: z.string().min(1),
  originalName: z.string().min(1),
  sizeBytes: z.int().nonnegative(),
  createdAt: FileModelSchema.shape.createdAt,
}))

export type AdminFileListQueryResult = z.input<typeof AdminFileListQueryResultSchema>
