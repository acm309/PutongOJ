import { z } from 'zod'
import { UserPrivilege } from '../../consts/index.js'
import { AVATAR_URL_LENGTH_MAX } from '../../consts/limit.js'
import { isoDatetimeToDate } from '../codec.js'

const UserAvatarSchema = z
  .url({ protocol: /^https$/, normalize: true })
  .max(AVATAR_URL_LENGTH_MAX)

export const UserModelSchema = z.object({
  uid: z.string().min(3).max(20).regex(/^[\w-]+$/),
  pwd: z.hex().length(72),
  privilege: z.enum(UserPrivilege),
  nick: z.string().max(30),
  avatar: z.union([UserAvatarSchema, z.literal('')]),
  motto: z.string().max(300),
  mail: z.union([z.email(), z.literal('')]),
  school: z.string().max(30),
  gid: z.array(z.int().nonnegative()),
  submit: z.int().nonnegative(),
  solve: z.int().nonnegative(),
  lastRequestId: z.string().optional(),
  lastVisitedAt: isoDatetimeToDate.optional(),
  createdAt: isoDatetimeToDate,
  updatedAt: isoDatetimeToDate,
})

export type UserModel = z.infer<typeof UserModelSchema>
