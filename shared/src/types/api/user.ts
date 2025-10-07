import { z } from 'zod'
import { UserModelSchema } from '../model/user.js'

export const UserProfileQueryResultSchema = z.object({
  uid: UserModelSchema.shape.uid,
  privilege: UserModelSchema.shape.privilege,
  nick: UserModelSchema.shape.nick,
  motto: UserModelSchema.shape.motto,
  mail: UserModelSchema.shape.mail.optional(),
  school: UserModelSchema.shape.school,
  groups: z.array(z.object({
    gid: z.number(),
    title: z.string(),
  })),
  avatarHash: z.string().nullable(),
  solved: z.array(z.number()),
  attempted: z.array(z.number()),
  createdAt: UserModelSchema.shape.createdAt,
})

export type UserProfileQueryResult = z.input<typeof UserProfileQueryResultSchema>
