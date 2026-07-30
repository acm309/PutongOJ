import { z } from 'zod'
import { SolutionModelSchema } from '../model/solution.js'
import { UserModelSchema } from '../model/user.js'
import { PaginatedResultSchema, PaginationSchema, SortOptionSchema } from './utils.js'

export const AccountProfileQueryResultSchema = z.object({
  id: UserModelSchema.shape.id,
  username: UserModelSchema.shape.username,
  privilege: UserModelSchema.shape.privilege,
  nickname: UserModelSchema.shape.nickname,
  avatarUrl: UserModelSchema.shape.avatarUrl,
  motto: UserModelSchema.shape.motto,
  email: UserModelSchema.shape.email,
  school: UserModelSchema.shape.school,
})

export type AccountProfileQueryResult = z.input<typeof AccountProfileQueryResultSchema>

export const AccountLoginPayloadSchema = z.object({
  username: UserModelSchema.shape.username,
  password: z.base64(),
})

export type AccountLoginPayload = z.infer<typeof AccountLoginPayloadSchema>

export const AccountRegisterPayloadSchema = z.object({
  username: UserModelSchema.shape.username,
  password: z.base64(),
})

export type AccountRegisterPayload = z.infer<typeof AccountRegisterPayloadSchema>

export const AccountEditPayloadSchema = z.object({
  nickname: UserModelSchema.shape.nickname.optional(),
  avatarUrl: UserModelSchema.shape.avatarUrl.optional(),
  motto: UserModelSchema.shape.motto.optional(),
  email: UserModelSchema.shape.email.optional(),
  school: UserModelSchema.shape.school.optional(),
})

export type AccountEditPayload = z.infer<typeof AccountEditPayloadSchema>

export const AccountChangePasswordPayloadSchema = z.object({
  oldPassword: z.base64(),
  newPassword: z.base64(),
})

export type AccountChangePasswordPayload = z.infer<typeof AccountChangePasswordPayloadSchema>

export const AccountSubmissionListQuerySchema = z.object({
  page: PaginationSchema.shape.page,
  pageSize: PaginationSchema.shape.pageSize.default(30),
  sort: SortOptionSchema.shape.sort,
  sortBy: z.enum(['createdAt', 'timeUsedMs', 'memoryUsedKb']).default('createdAt'),
  problemId: z.coerce.number().int().positive().optional(),
  contestId: z.coerce.number().int().positive().optional(),
  status: SolutionModelSchema.shape.status.optional(),
  language: SolutionModelSchema.shape.language.optional(),
})

export type AccountSubmissionListQuery = z.infer<typeof AccountSubmissionListQuerySchema>

export const AccountSubmissionListQueryResultSchema = PaginatedResultSchema(z.object({
  id: SolutionModelSchema.shape.id,
  problemId: SolutionModelSchema.shape.problemId,
  contestId: SolutionModelSchema.shape.contestId,
  language: SolutionModelSchema.shape.language,
  status: SolutionModelSchema.shape.status,
  timeUsedMs: SolutionModelSchema.shape.timeUsedMs,
  memoryUsedKb: SolutionModelSchema.shape.memoryUsedKb,
  similarity: SolutionModelSchema.shape.similarity,
  createdAt: SolutionModelSchema.shape.createdAt,
}))

export type AccountSubmissionListQueryResult = z.input<typeof AccountSubmissionListQueryResultSchema>

export const SessionListQueryResultSchema = z.array(z.object({
  sessionId: z.string(),
  current: z.boolean(),
  lastAccessAt: z.iso.datetime(),
  loginAt: z.iso.datetime(),
  loginIp: z.string(),
  userAgent: z.string(),
}))

export type SessionListQueryResult = z.input<typeof SessionListQueryResultSchema>

export const SessionRevokeOthersResultSchema = z.object({
  removed: z.number(),
})

export type SessionRevokeOthersResult = z.input<typeof SessionRevokeOthersResultSchema>
