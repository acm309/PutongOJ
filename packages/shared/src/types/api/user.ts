import { z } from 'zod'
import { GroupModelSchema } from '../model/group.js'
import { UserModelSchema } from '../model/user.js'
import { PaginatedResultSchema, PaginationSchema } from './utils.js'

export const UserSubmissionHeatmapSchema = z.object({
  data: z.record(z.string(), z.number()),
  startDate: z.string(),
  endDate: z.string(),
  timezone: z.string(),
})

export type UserSubmissionHeatmap = z.infer<typeof UserSubmissionHeatmapSchema>

export const UserProfileQueryResultSchema = z.object({
  id: UserModelSchema.shape.id,
  username: UserModelSchema.shape.username,
  privilege: UserModelSchema.shape.privilege,
  nickname: UserModelSchema.shape.nickname,
  avatarUrl: UserModelSchema.shape.avatarUrl,
  motto: UserModelSchema.shape.motto,
  email: UserModelSchema.shape.email.optional(),
  school: UserModelSchema.shape.school,
  groups: z.array(z.object({
    id: GroupModelSchema.shape.id,
    name: GroupModelSchema.shape.name,
  })),
  codeforces: z.object({
    handle: z.string(),
    rating: z.number(),
  }).nullable(),
  solved: z.array(z.number()),
  attempted: z.array(z.number()),
  submissionHeatmap: UserSubmissionHeatmapSchema,
  createdAt: UserModelSchema.shape.createdAt,
})

export type UserProfileQueryResult = z.input<typeof UserProfileQueryResultSchema>

export const UserRanklistQuerySchema = z.object({
  page: PaginationSchema.shape.page,
  pageSize: PaginationSchema.shape.pageSize.default(30),
  groupId: z.coerce.number().int().positive().optional(),
})

export type UserRanklistQuery = z.infer<typeof UserRanklistQuerySchema>

export const UserRanklistQueryResultSchema = PaginatedResultSchema(z.object({
  id: UserModelSchema.shape.id,
  username: UserModelSchema.shape.username,
  nickname: UserModelSchema.shape.nickname,
  avatarUrl: UserModelSchema.shape.avatarUrl,
  motto: UserModelSchema.shape.motto,
  solvedProblemCount: z.int().nonnegative(),
  submittedProblemCount: z.int().nonnegative(),
}))

export type UserRanklistQueryResult = z.input<typeof UserRanklistQueryResultSchema>

export const UserRanklistExportQuerySchema = z.object({
  groupId: z.coerce.number().int().positive().optional(),
})

export type UserRanklistExportQuery = z.infer<typeof UserRanklistExportQuerySchema>

export const UserRanklistExportQueryResultSchema = z.array(z.object({
  id: UserModelSchema.shape.id,
  username: UserModelSchema.shape.username,
  nickname: UserModelSchema.shape.nickname,
  solvedProblemCount: z.int().nonnegative(),
  submittedProblemCount: z.int().nonnegative(),
}))

export type UserRanklistExportQueryResult = z.input<typeof UserRanklistExportQueryResultSchema>

export const UserSuggestQuerySchema = z.object({
  keyword: z.string().min(1).max(30),
})

export type UserSuggestQuery = z.infer<typeof UserSuggestQuerySchema>

export const UserSuggestQueryResultSchema = z.array(z.object({
  id: UserModelSchema.shape.id,
  username: UserModelSchema.shape.username,
  nickname: UserModelSchema.shape.nickname.optional(),
}))

export type UserSuggestQueryResult = z.input<typeof UserSuggestQueryResultSchema>

export const UserItemListQueryResultSchema = z.array(z.object({
  id: UserModelSchema.shape.id,
  username: UserModelSchema.shape.username,
  nickname: UserModelSchema.shape.nickname.optional(),
}))

export type UserItemListQueryResult = z.input<typeof UserItemListQueryResultSchema>
