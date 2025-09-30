import { z } from 'zod'
import { UserPrivilege } from '../../consts/index.js'
import { isoDatetimeToDate } from '../codec.js'

export const UserModelSchema = z.object({
  uid: z.string().min(3).max(20).regex(/^[\w-]+$/),
  pwd: z.hex().length(72),
  privilege: z.enum(UserPrivilege),
  nick: z.string().max(30),
  motto: z.string().max(300),
  mail: z.email(),
  school: z.string().max(30),
  gid: z.array(z.int().nonnegative()),
  submit: z.int().nonnegative(),
  solve: z.int().nonnegative(),
  lastVisitedAt: isoDatetimeToDate.optional(),
  createdAt: isoDatetimeToDate,
  updatedAt: isoDatetimeToDate,
})

export type UserModel = z.infer<typeof UserModelSchema>
