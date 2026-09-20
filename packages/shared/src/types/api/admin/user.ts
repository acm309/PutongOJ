import { z } from 'zod'
import { OAuthProvider, UserPrivilege } from '@/consts/index.js'
import { stringToInt } from '../../codec.js'
import { OAuthModelSchema, UserModelSchema } from '../../model/index.js'
import {
  PaginatedSchema,
  PaginationSchema,
  SortOptionSchema,
} from '../utils.js'

export const AdminUserListQuerySchema = z.object({
  page: PaginationSchema.shape.page,
  pageSize: PaginationSchema.shape.pageSize.default(30),
  sort: SortOptionSchema.shape.sort,
  sortBy: z.enum([ 'uid', 'createdAt', 'lastVisitedAt' ]).default('lastVisitedAt'),
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
  avatar: UserModelSchema.shape.avatar,
  motto: UserModelSchema.shape.motto,
  mail: UserModelSchema.shape.mail,
  school: UserModelSchema.shape.school,
  storageQuota: UserModelSchema.shape.storageQuota,
  lastRequestId: UserModelSchema.shape.lastRequestId,
  lastVisitedAt: UserModelSchema.shape.lastVisitedAt,
  createdAt: UserModelSchema.shape.createdAt,
})

export type AdminUserDetailQueryResult = z.input<typeof AdminUserDetailQueryResultSchema>

export const AdminUserEditPayloadSchema = z.object({
  privilege: z.enum(UserPrivilege).optional(),
  nick: UserModelSchema.shape.nick.optional(),
  avatar: UserModelSchema.shape.avatar.optional(),
  motto: UserModelSchema.shape.motto.optional(),
  mail: UserModelSchema.shape.mail.optional(),
  school: UserModelSchema.shape.school.optional(),
  storageQuota: UserModelSchema.shape.storageQuota.optional(),
})

export type AdminUserEditPayload = z.infer<typeof AdminUserEditPayloadSchema>

export const AdminUserChangePasswordPayloadSchema = z.object({
  newPassword: z.base64(),
})

export type AdminUserChangePasswordPayload = z.infer<typeof AdminUserChangePasswordPayloadSchema>

export const AdminUserOAuthQueryResultSchema = z.record(
  z.enum(OAuthProvider),
  z.object({
    providerId: OAuthModelSchema.shape.providerId,
    displayName: OAuthModelSchema.shape.displayName,
    createdAt: OAuthModelSchema.shape.createdAt,
  }).nullable(),
)

export type AdminUserOAuthQueryResult = z.input<typeof AdminUserOAuthQueryResultSchema>

export const AdminUserBatchRegisterPayloadSchema = z.array(z.object({
  username: UserModelSchema.shape.uid,
  password: z.string(),
  nick: UserModelSchema.shape.nick.optional(),
})).min(1).max(1000)

export type AdminUserBatchRegisterPayload = z.infer<typeof AdminUserBatchRegisterPayloadSchema>

export const AdminUserBatchRegisterResultSchema = z.object({
  total: z.int().nonnegative(),
  created: z.int().nonnegative(),
  failed: z.int().nonnegative(),
  results: z.array(z.object({
    username: UserModelSchema.shape.uid,
    success: z.boolean(),
    message: z.string().optional(),
  })),
})

export type AdminUserBatchRegisterResult = z.input<typeof AdminUserBatchRegisterResultSchema>
