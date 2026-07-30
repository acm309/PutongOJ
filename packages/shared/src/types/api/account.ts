import { z } from 'zod'
import { SubmissionFieldsSchema } from '../fields/submission.js'
import { UserFieldsSchema } from '../fields/user.js'
import { PaginatedResultSchema, PaginationSchema, SortOptionSchema } from './utils.js'

export const AccountProfileQueryResultSchema = z.object({
  id: UserFieldsSchema.shape.id,
  username: UserFieldsSchema.shape.username,
  privilege: UserFieldsSchema.shape.privilege,
  nickname: UserFieldsSchema.shape.nickname,
  avatarUrl: UserFieldsSchema.shape.avatarUrl,
  motto: UserFieldsSchema.shape.motto,
  email: UserFieldsSchema.shape.email,
  school: UserFieldsSchema.shape.school,
})

export type AccountProfileQueryResult = z.input<typeof AccountProfileQueryResultSchema>

export const AccountLoginPayloadSchema = z.object({
  username: UserFieldsSchema.shape.username,
  password: z.base64(),
})

export type AccountLoginPayload = z.infer<typeof AccountLoginPayloadSchema>

export const AccountRegisterPayloadSchema = z.object({
  username: UserFieldsSchema.shape.username,
  password: z.base64(),
})

export type AccountRegisterPayload = z.infer<typeof AccountRegisterPayloadSchema>

export const AccountEditPayloadSchema = z.object({
  nickname: UserFieldsSchema.shape.nickname.optional(),
  avatarUrl: UserFieldsSchema.shape.avatarUrl.optional(),
  motto: UserFieldsSchema.shape.motto.optional(),
  email: UserFieldsSchema.shape.email.optional(),
  school: UserFieldsSchema.shape.school.optional(),
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
  status: SubmissionFieldsSchema.shape.status.optional(),
  language: SubmissionFieldsSchema.shape.language.optional(),
})

export type AccountSubmissionListQuery = z.infer<typeof AccountSubmissionListQuerySchema>

export const AccountSubmissionListQueryResultSchema = PaginatedResultSchema(z.object({
  id: SubmissionFieldsSchema.shape.id,
  problemId: SubmissionFieldsSchema.shape.problemId,
  contestId: SubmissionFieldsSchema.shape.contestId,
  language: SubmissionFieldsSchema.shape.language,
  status: SubmissionFieldsSchema.shape.status,
  timeUsedMs: SubmissionFieldsSchema.shape.timeUsedMs,
  memoryUsedKb: SubmissionFieldsSchema.shape.memoryUsedKb,
  similarity: SubmissionFieldsSchema.shape.similarity,
  createdAt: SubmissionFieldsSchema.shape.createdAt,
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
