import { z } from 'zod'
import { stringToInt } from '../codec'
import { PAGE_SIZE_MAX } from './limit'
import { QuerySort } from '../enum'

export const SortOptionSchema = z.object({
  sort: stringToInt.pipe(z.enum(QuerySort)).default(QuerySort.Desc),
})

export const PaginationSchema = z.object({
  page: stringToInt.pipe(z.int().positive()).default(1),
  pageSize: stringToInt.pipe(z.int().positive().max(PAGE_SIZE_MAX)).optional(),
})

export function PaginatedSchema<T extends z.ZodType> (schema: T) {
  return z.object({
    docs: z.array(schema),
    limit: z.number(),
    page: z.number(),
    pages: z.number(),
    total: z.number(),
  })
}
