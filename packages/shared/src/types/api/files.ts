import { z } from 'zod'
import { FileModelSchema, UserModelSchema } from '../model/index.js'
import { PaginatedSchema, PaginationSchema, SortOptionSchema } from './utils.js'

export const FileListQuerySchema = z.object({
  page: PaginationSchema.shape.page,
  pageSize: PaginationSchema.shape.pageSize.default(30),
  sort: SortOptionSchema.shape.sort,
  sortBy: z.enum(['createdAt', 'sizeBytes']).default('createdAt'),
})

export type FileListQuery = z.infer<typeof FileListQuerySchema>

export const FileListQueryResultSchema = z.object({
  files: PaginatedSchema(z.object({
    storageKey: FileModelSchema.shape.storageKey,
    originalName: FileModelSchema.shape.originalName,
    sizeBytes: FileModelSchema.shape.sizeBytes,
    createdAt: FileModelSchema.shape.createdAt,
  })),
  usage: z.object({
    usedBytes: z.int().nonnegative(),
    storageQuota: UserModelSchema.shape.storageQuota,
  }),
})

export type FileListQueryResult = z.input<typeof FileListQueryResultSchema>

export const FileUploadResultSchema = z.object({
  url: z.string().startsWith('/uploads/'),
  storageKey: FileModelSchema.shape.storageKey,
  sizeBytes: FileModelSchema.shape.sizeBytes,
})

export type FileUploadResult = z.input<typeof FileUploadResultSchema>
