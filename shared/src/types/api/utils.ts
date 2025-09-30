import type { ErrorCode } from '@/consts/index.js'
import { z } from 'zod'
import { QuerySort } from '@/consts/index.js'
import { stringToInt } from '../codec.js'
import { PAGE_SIZE_MAX } from './limit.js'

export const SortOptionSchema = z.object({
  sort: stringToInt.pipe(z.enum(QuerySort)).default(QuerySort.Desc),
})

export const PaginationSchema = z.object({
  page: stringToInt.pipe(z.int().positive()).default(1),
  pageSize: stringToInt.pipe(z.int().positive().max(PAGE_SIZE_MAX)).optional(),
})

export function PaginatedSchema<T extends z.ZodType>(schema: T) {
  return z.object({
    docs: z.array(schema),
    limit: z.number(),
    page: z.number(),
    pages: z.number(),
    total: z.number(),
  })
}

export type Paginated<T> = {
  docs: T[]
  limit: number
  page: number
  pages: number
  total: number
}

type SuccessEnveloped<T = any> = {
  success: true
  code: ErrorCode.OK
  message: string
  data: T
  requestId: string
}

type ErrorEnveloped = {
  success: false
  code: Exclude<ErrorCode, ErrorCode.OK>
  message: string
  data: null
  requestId: string
}

export type Enveloped<T = any> = SuccessEnveloped<T> | ErrorEnveloped
