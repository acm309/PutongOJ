import { z } from 'zod'
import { stringToInt } from '../codec.js'
import { GroupModelSchema } from '../model/group.js'
import { UserModelSchema } from '../model/user.js'
import { PaginatedSchema, PaginationSchema } from './utils.js'

export const UserProfileQueryResultSchema = z.object({
  uid: UserModelSchema.shape.uid,
  privilege: UserModelSchema.shape.privilege,
  nick: UserModelSchema.shape.nick,
  avatar: UserModelSchema.shape.avatar,
  motto: UserModelSchema.shape.motto,
  mail: UserModelSchema.shape.mail.optional(),
  school: UserModelSchema.shape.school,
  groups: z.array(z.object({
    gid: GroupModelSchema.shape.gid,
    title: GroupModelSchema.shape.title,
  })),
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
  avatar: UserModelSchema.shape.avatar,
  motto: UserModelSchema.shape.motto,
  solve: UserModelSchema.shape.solve,
  submit: UserModelSchema.shape.submit,
}))

export type UserRanklistQueryResult = z.input<typeof UserRanklistQueryResultSchema>

export const UserRanklistExportQuerySchema = z.object({
  group: stringToInt.pipe(GroupModelSchema.shape.gid).optional(),
})

export type UserRanklistExportQuery = z.infer<typeof UserRanklistExportQuerySchema>

export const UserRanklistExportQueryResultSchema = z.array(z.object({
  uid: UserModelSchema.shape.uid,
  nick: UserModelSchema.shape.nick,
  solve: UserModelSchema.shape.solve,
  submit: UserModelSchema.shape.submit,
}))

export type UserRanklistExportQueryResult = z.input<typeof UserRanklistExportQueryResultSchema>

export const UserSuggestQuerySchema = z.object({
  keyword: z.string().min(1).max(30),
})

export type UserSuggestQuery = z.infer<typeof UserSuggestQuerySchema>

export const UserSuggestQueryResultSchema = z.array(z.object({
  uid: UserModelSchema.shape.uid,
  nick: UserModelSchema.shape.nick.optional(),
}))

export type UserSuggestQueryResult = z.input<typeof UserSuggestQueryResultSchema>

export const UserItemListQueryResultSchema = z.array(z.object({
  uid: UserModelSchema.shape.uid,
  nick: UserModelSchema.shape.nick.optional(),
}))

export type UserItemListQueryResult = z.input<typeof UserItemListQueryResultSchema>
