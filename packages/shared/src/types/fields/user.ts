import { z } from 'zod'
import { UserPrivilege } from '../../consts/index.js'
import { AVATAR_URL_LENGTH_MAX } from '../../consts/limit.js'
import { isoDatetimeToDate } from '../codec.js'

export const UserAvatarSchema = z.union([
  z.url({ protocol: /^https$/, normalize: true }).max(AVATAR_URL_LENGTH_MAX),
  z.string().startsWith('/').max(AVATAR_URL_LENGTH_MAX),
  z.literal(''),
])

export const UserFieldsSchema = z.object({
  id: z.int().positive(),
  username: z.string().min(3).max(20).regex(/^[\w-]+$/),
  privilege: z.enum(UserPrivilege),
  nickname: z.string().max(30),
  avatarUrl: UserAvatarSchema,
  motto: z.string().max(300),
  email: z.union([z.email(), z.literal('')]),
  school: z.string().max(30),
  storageQuota: z.int().nonnegative(),
  lastRequestId: z.string().nullable(),
  lastVisitedAt: isoDatetimeToDate.nullable(),
  createdAt: isoDatetimeToDate,
  updatedAt: isoDatetimeToDate,
})
