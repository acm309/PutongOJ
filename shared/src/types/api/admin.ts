import { z } from 'zod'
import { UserPrivilege } from '../../consts/index.js'
import { stringToInt } from '../codec.js'
import { UserModelSchema } from '../model/user.js'
import { PaginatedSchema, PaginationSchema, SortOptionSchema } from './utils.js'

export const AdminUserListQuerySchema = z.object({
  page: PaginationSchema.shape.page,
  pageSize: PaginationSchema.shape.pageSize.default(30),
  sort: SortOptionSchema.shape.sort,
  sortBy: z.enum(['uid', 'createdAt', 'lastVisitedAt']).default('lastVisitedAt'),
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

export const AdminUserDetailQueryResultSchema = z.object({
  uid: UserModelSchema.shape.uid,
  privilege: UserModelSchema.shape.privilege,
  nick: UserModelSchema.shape.nick,
  motto: UserModelSchema.shape.motto,
  mail: UserModelSchema.shape.mail,
  school: UserModelSchema.shape.school,
  lastVisitedAt: UserModelSchema.shape.lastVisitedAt,
  createdAt: UserModelSchema.shape.createdAt,
})

export type AdminUserDetailQueryResult = z.input<typeof AdminUserDetailQueryResultSchema>

export const AdminUserEditPayloadSchema = z.object({
  privilege: z.enum(UserPrivilege).optional(),
  nick: UserModelSchema.shape.nick.optional(),
  motto: UserModelSchema.shape.motto.optional(),
  mail: UserModelSchema.shape.mail.optional(),
  school: UserModelSchema.shape.school.optional(),
})

export type AdminUserEditPayload = z.infer<typeof AdminUserEditPayloadSchema>

export const AdminUserChangePasswordPayloadSchema = z.object({
  newPassword: z.base64(),
})

export type AdminUserChangePasswordPayload = z.infer<typeof AdminUserChangePasswordPayloadSchema>
