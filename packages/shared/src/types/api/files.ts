import { z } from 'zod'
import { FileFieldsSchema, UserFieldsSchema } from '../fields/index.js'
import { PaginatedResultSchema, PaginationSchema, SortOptionSchema } from './utils.js'

export const FileListQuerySchema = z.object({
  page: PaginationSchema.shape.page,
  pageSize: PaginationSchema.shape.pageSize.default(30),
  sort: SortOptionSchema.shape.sort,
  sortBy: z.enum(['createdAt', 'sizeBytes']).default('createdAt'),
})

export type FileListQuery = z.infer<typeof FileListQuerySchema>

export const FileListQueryResultSchema = z.object({
  files: PaginatedResultSchema(z.object({
    storageKey: FileFieldsSchema.shape.storageKey,
    originalName: FileFieldsSchema.shape.originalName,
    sizeBytes: FileFieldsSchema.shape.sizeBytes,
    createdAt: FileFieldsSchema.shape.createdAt,
  })),
  usage: z.object({
    usedBytes: z.int().nonnegative(),
    storageQuota: UserFieldsSchema.shape.storageQuota,
  }),
})

export type FileListQueryResult = z.input<typeof FileListQueryResultSchema>

export const FileUploadResultSchema = z.object({
  url: z.string().startsWith('/uploads/'),
  storageKey: FileFieldsSchema.shape.storageKey,
  sizeBytes: FileFieldsSchema.shape.sizeBytes,
})

export type FileUploadResult = z.input<typeof FileUploadResultSchema>
