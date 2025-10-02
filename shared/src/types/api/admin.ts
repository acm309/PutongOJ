import { z } from 'zod'
import { UserPrivilege } from '../../consts/index.js'
import { stringToInt } from '../codec.js'
import { UserModelSchema } from '../model/user.js'
import { PaginatedSchema, PaginationSchema, SortOptionSchema } from './utils.js'

export const AdminUserListQuerySchema = z.object({
  page: PaginationSchema.shape.page,
  pageSize: PaginationSchema.shape.pageSize.default(30),
  sort: SortOptionSchema.shape.sort,
  sortBy: z.enum(['uid', 'createdAt', 'lastVisitedAt']).default('createdAt'),
  keyword: z.string().max(30).optional(),
  privilege: stringToInt.pipe(z.enum(UserPrivilege)).optional(),
})

export type AdminUserListQuery = z.infer<typeof AdminUserListQuerySchema>

export const AdminUserListQueryResultSchema = PaginatedSchema(z.object({
  uid: UserModelSchema.shape.uid,
  privilege: UserModelSchema.shape.privilege,
  nick: UserModelSchema.shape.nick.optional(),
  createdAt: UserModelSchema.shape.createdAt,
  lastVisitedAt: UserModelSchema.shape.lastVisitedAt.optional(),
}))

export type AdminUserListQueryResult = z.input<typeof AdminUserListQueryResultSchema>
