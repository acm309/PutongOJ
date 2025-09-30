import { z } from 'zod'
import { stringToInt } from '../codec'
import { UserPrivilege } from '../enum'
import { UserModelSchema } from '../model/user'
import { PaginatedSchema, PaginationSchema, SortOptionSchema } from './utils'

export const AdminUsersQuerySchema = z.object({
  page: PaginationSchema.shape.page,
  pageSize: PaginationSchema.shape.pageSize.default(30),
  sort: SortOptionSchema.shape.sort,
  sortBy: z.enum([ 'uid', 'createdAt', 'updatedAt', 'lastVisitedAt' ]).default('createdAt'),
  keyword: z.string().max(30).optional(),
  privilege: stringToInt.pipe(z.enum(UserPrivilege)).optional(),
})

export type AdminUsersQuery = z.infer<typeof AdminUsersQuerySchema>

export const AdminUsersQueryResultSchema = PaginatedSchema(z.object({
  uid: UserModelSchema.shape.uid,
  privilege: UserModelSchema.shape.privilege,
  nick: UserModelSchema.shape.nick.optional(),
  lastVisitedAt: UserModelSchema.shape.lastVisitedAt.optional(),
  createdAt: UserModelSchema.shape.createdAt,
  updatedAt: UserModelSchema.shape.updatedAt,
}))

export type AdminUsersQueryResult = z.input<typeof AdminUsersQueryResultSchema>
