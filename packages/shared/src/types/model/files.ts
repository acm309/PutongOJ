import { z } from 'zod'
import { isoDatetimeToDate } from '../codec.js'
import { ObjectIdSchema } from '../utils.js'

export const FileModelSchema = z.object({
  storageKey: z.string().min(1),
  originalName: z.string().min(1),
  sizeBytes: z.int().nonnegative(),
  owner: ObjectIdSchema,
  deletedAt: isoDatetimeToDate.nullable(),
  deletedBy: ObjectIdSchema.nullable(),
  createdAt: isoDatetimeToDate,
  updatedAt: isoDatetimeToDate,
})

export type FileModel = z.infer<typeof FileModelSchema>
