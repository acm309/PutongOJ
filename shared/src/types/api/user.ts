import { z } from 'zod'
import { stringToInt } from '../codec.js'
import { GroupModelSchema } from '../model/group.js'
import { UserModelSchema } from '../model/user.js'
import { PaginatedSchema, PaginationSchema } from './utils.js'

export const UserProfileQueryResultSchema = z.object({
  uid: UserModelSchema.shape.uid,
  privilege: UserModelSchema.shape.privilege,
  nick: UserModelSchema.shape.nick,
  motto: UserModelSchema.shape.motto,
  mail: UserModelSchema.shape.mail.optional(),
  school: UserModelSchema.shape.school,
  groups: z.array(z.object({
    gid: GroupModelSchema.shape.gid,
    title: GroupModelSchema.shape.title,
  })),
  avatarHash: z.string().nullable(),
  solved: z.array(z.number()),
  attempted: z.array(z.number()),
  createdAt: UserModelSchema.shape.createdAt,
})

export type UserProfileQueryResult = z.input<typeof UserProfileQueryResultSchema>

export const UserRanklistQuerySchema = z.object({
  page: PaginationSchema.shape.page,
  pageSize: PaginationSchema.shape.pageSize.default(30),
  group: stringToInt.pipe(GroupModelSchema.shape.gid).optional(),
})

export type UserRanklistQuery = z.infer<typeof UserRanklistQuerySchema>

export const UserRanklistQueryResultSchema = PaginatedSchema(z.object({
  uid: UserModelSchema.shape.uid,
  nick: UserModelSchema.shape.nick,
  motto: UserModelSchema.shape.motto,
  solve: UserModelSchema.shape.solve,
  submit: UserModelSchema.shape.submit,
}))

export type UserRanklistQueryResult = z.input<typeof UserRanklistQueryResultSchema>
