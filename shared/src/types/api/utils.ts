import type { ErrorCode } from '@/consts/index.js'
import { z } from 'zod'
import { OAuthProvider, QuerySort } from '@/consts/index.js'
import { PAGE_SIZE_MAX } from '@/consts/limit.js'
import { isoDatetimeToDate, stringToInt } from '../codec.js'
import { UserAvatarSchema } from '../model/user.js'

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

export type SuccessEnveloped<T = any> = {
  success: true
  code: 200
  message: string
  data: T
  requestId: string
}

export type ErrorEnveloped = {
  success: false
  code: ErrorCode | -1
  message: string
  data: null
  requestId: string
}

export type Enveloped<T = any> = SuccessEnveloped<T> | ErrorEnveloped

export const AvatarPresetsQueryResultSchema = z.array(UserAvatarSchema)

export type AvatarPresetsQueryResult = z.input<typeof AvatarPresetsQueryResultSchema>

export const PublicConfigQueryResultSchema = z.object({
  name: z.string(),
  backendVersion: z.object({
    commitHash: z.string(),
    buildAt: isoDatetimeToDate,
  }),
  apiPublicKey: z.string(),
  oauthEnabled: z.record(z.enum(OAuthProvider), z.boolean()),
  helpDocURL: z.string().optional(),
})

export type PublicConfigQueryResult = z.input<typeof PublicConfigQueryResultSchema>
