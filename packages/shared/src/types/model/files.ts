import { z } from 'zod'
import { isoDatetimeToDate } from '../codec.js'

export const FileModelSchema = z.object({
  storageKey: z.string().min(1),
  originalName: z.string().min(1),
  sizeBytes: z.int().nonnegative(),
  ownerId: z.int().positive(),
  deletedAt: isoDatetimeToDate.nullable(),
  deletedById: z.int().positive().nullable(),
  createdAt: isoDatetimeToDate,
  updatedAt: isoDatetimeToDate,
})

export type FileModel = z.infer<typeof FileModelSchema>
