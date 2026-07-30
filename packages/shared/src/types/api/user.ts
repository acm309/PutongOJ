import { z } from 'zod'
import { GroupFieldsSchema } from '../fields/group.js'
import { UserFieldsSchema } from '../fields/user.js'
import { PaginatedResultSchema, PaginationSchema } from './utils.js'

export const UserSubmissionHeatmapSchema = z.object({
  data: z.record(z.string(), z.number()),
  startDate: z.string(),
  endDate: z.string(),
  timezone: z.string(),
})

export type UserSubmissionHeatmap = z.infer<typeof UserSubmissionHeatmapSchema>

export const UserProfileQueryResultSchema = z.object({
  id: UserFieldsSchema.shape.id,
  username: UserFieldsSchema.shape.username,
  privilege: UserFieldsSchema.shape.privilege,
  nickname: UserFieldsSchema.shape.nickname,
  avatarUrl: UserFieldsSchema.shape.avatarUrl,
  motto: UserFieldsSchema.shape.motto,
  email: UserFieldsSchema.shape.email.optional(),
  school: UserFieldsSchema.shape.school,
  groups: z.array(z.object({
    id: GroupFieldsSchema.shape.id,
    name: GroupFieldsSchema.shape.name,
  })),
  codeforces: z.object({
    handle: z.string(),
    rating: z.number(),
  }).nullable(),
  solved: z.array(z.number()),
  attempted: z.array(z.number()),
  submissionHeatmap: UserSubmissionHeatmapSchema,
  createdAt: UserFieldsSchema.shape.createdAt,
})

export type UserProfileQueryResult = z.input<typeof UserProfileQueryResultSchema>

export const UserRanklistQuerySchema = z.object({
  page: PaginationSchema.shape.page,
  pageSize: PaginationSchema.shape.pageSize.default(30),
  groupId: z.coerce.number().int().positive().optional(),
})

export type UserRanklistQuery = z.infer<typeof UserRanklistQuerySchema>

export const UserRanklistQueryResultSchema = PaginatedResultSchema(z.object({
  id: UserFieldsSchema.shape.id,
  username: UserFieldsSchema.shape.username,
  nickname: UserFieldsSchema.shape.nickname,
  avatarUrl: UserFieldsSchema.shape.avatarUrl,
  motto: UserFieldsSchema.shape.motto,
  solvedProblemCount: z.int().nonnegative(),
  submittedProblemCount: z.int().nonnegative(),
}))

export type UserRanklistQueryResult = z.input<typeof UserRanklistQueryResultSchema>

export const UserRanklistExportQuerySchema = z.object({
  groupId: z.coerce.number().int().positive().optional(),
})

export type UserRanklistExportQuery = z.infer<typeof UserRanklistExportQuerySchema>

export const UserRanklistExportQueryResultSchema = z.array(z.object({
  id: UserFieldsSchema.shape.id,
  username: UserFieldsSchema.shape.username,
  nickname: UserFieldsSchema.shape.nickname,
  solvedProblemCount: z.int().nonnegative(),
  submittedProblemCount: z.int().nonnegative(),
}))

export type UserRanklistExportQueryResult = z.input<typeof UserRanklistExportQueryResultSchema>

export const UserSuggestQuerySchema = z.object({
  keyword: z.string().min(1).max(30),
})

export type UserSuggestQuery = z.infer<typeof UserSuggestQuerySchema>

export const UserSuggestQueryResultSchema = z.array(z.object({
  id: UserFieldsSchema.shape.id,
  username: UserFieldsSchema.shape.username,
  nickname: UserFieldsSchema.shape.nickname.optional(),
}))

export type UserSuggestQueryResult = z.input<typeof UserSuggestQueryResultSchema>

export const UserItemListQueryResultSchema = z.array(z.object({
  id: UserFieldsSchema.shape.id,
  username: UserFieldsSchema.shape.username,
  nickname: UserFieldsSchema.shape.nickname.optional(),
}))

export type UserItemListQueryResult = z.input<typeof UserItemListQueryResultSchema>
