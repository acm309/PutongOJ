import { z } from 'zod'
import {
  OAuthProvider,
  TITLE_LENGTH_MAX,
} from '@/consts/index.js'
import {
  CommentFieldsSchema,
  ContestFieldsSchema,
  DiscussionFieldsSchema,
  FileFieldsSchema,
  GroupFieldsSchema,
  OAuthFieldsSchema,
  PostFieldsSchema,
  ProblemFieldsSchema,
  SubmissionFieldsSchema,
  TagFieldsSchema,
  UserFieldsSchema,
} from '../fields/index.js'
import { UserAvatarSchema } from '../fields/user.js'
import {
  PaginatedResultSchema,
  PaginationSchema,
  SortOptionSchema,
} from './utils.js'

export const AdminUserListQuerySchema = z.object({
  page: PaginationSchema.shape.page,
  pageSize: PaginationSchema.shape.pageSize.default(30),
  sort: SortOptionSchema.shape.sort,
  sortBy: z.enum(['username', 'createdAt', 'lastVisitedAt']).default('lastVisitedAt'),
  keyword: z.string().max(30).optional(),
  privilege: UserFieldsSchema.shape.privilege.optional(),
})

export type AdminUserListQuery = z.infer<typeof AdminUserListQuerySchema>

export const AdminUserListQueryResultSchema = PaginatedResultSchema(z.object({
  id: UserFieldsSchema.shape.id,
  username: UserFieldsSchema.shape.username,
  privilege: UserFieldsSchema.shape.privilege,
  nickname: UserFieldsSchema.shape.nickname.optional(),
  createdAt: UserFieldsSchema.shape.createdAt,
  lastVisitedAt: UserFieldsSchema.shape.lastVisitedAt.optional(),
}))

export type AdminUserListQueryResult = z.input<typeof AdminUserListQueryResultSchema>

export const AdminUserDetailQueryResultSchema = z.object({
  id: UserFieldsSchema.shape.id,
  username: UserFieldsSchema.shape.username,
  privilege: UserFieldsSchema.shape.privilege,
  nickname: UserFieldsSchema.shape.nickname,
  avatarUrl: UserFieldsSchema.shape.avatarUrl,
  motto: UserFieldsSchema.shape.motto,
  email: UserFieldsSchema.shape.email,
  school: UserFieldsSchema.shape.school,
  storageQuota: UserFieldsSchema.shape.storageQuota,
  lastRequestId: UserFieldsSchema.shape.lastRequestId,
  lastVisitedAt: UserFieldsSchema.shape.lastVisitedAt,
  createdAt: UserFieldsSchema.shape.createdAt,
})

export type AdminUserDetailQueryResult = z.input<typeof AdminUserDetailQueryResultSchema>

export const AdminUserEditPayloadSchema = z.object({
  privilege: UserFieldsSchema.shape.privilege.optional(),
  nickname: UserFieldsSchema.shape.nickname.optional(),
  avatarUrl: UserFieldsSchema.shape.avatarUrl.optional(),
  motto: UserFieldsSchema.shape.motto.optional(),
  email: UserFieldsSchema.shape.email.optional(),
  school: UserFieldsSchema.shape.school.optional(),
  storageQuota: UserFieldsSchema.shape.storageQuota.optional(),
})

export type AdminUserEditPayload = z.infer<typeof AdminUserEditPayloadSchema>

export const AdminUserChangePasswordPayloadSchema = z.object({
  newPassword: z.base64(),
})

export type AdminUserChangePasswordPayload = z.infer<typeof AdminUserChangePasswordPayloadSchema>

export const AdminUserOAuthQueryResultSchema = z.record(
  z.enum(OAuthProvider),
  z.object({
    providerId: OAuthFieldsSchema.shape.providerId,
    displayName: OAuthFieldsSchema.shape.displayName,
    createdAt: OAuthFieldsSchema.shape.createdAt,
  }).nullable(),
)

export type AdminUserOAuthQueryResult = z.input<typeof AdminUserOAuthQueryResultSchema>

export const AdminSolutionListQuerySchema = z.object({
  page: PaginationSchema.shape.page,
  pageSize: PaginationSchema.shape.pageSize.default(30),
  sort: SortOptionSchema.shape.sort,
  sortBy: z.enum(['createdAt', 'timeUsedMs', 'memoryUsedKb']).default('createdAt'),
  username: z.string().max(30).optional(),
  problemId: z.coerce.number().int().positive().optional(),
  contestId: z.coerce.number().int().positive().optional(),
  status: SubmissionFieldsSchema.shape.status.optional(),
  language: SubmissionFieldsSchema.shape.language.optional(),
})

export type AdminSolutionListQuery = z.infer<typeof AdminSolutionListQuerySchema>

export const AdminSolutionListQueryResultSchema = PaginatedResultSchema(z.object({
  id: SubmissionFieldsSchema.shape.id,
  problemId: SubmissionFieldsSchema.shape.problemId,
  userId: SubmissionFieldsSchema.shape.userId,
  contestId: SubmissionFieldsSchema.shape.contestId,
  language: SubmissionFieldsSchema.shape.language,
  status: SubmissionFieldsSchema.shape.status,
  timeUsedMs: SubmissionFieldsSchema.shape.timeUsedMs,
  memoryUsedKb: SubmissionFieldsSchema.shape.memoryUsedKb,
  similarity: SubmissionFieldsSchema.shape.similarity,
  similarSubmissionId: SubmissionFieldsSchema.shape.similarSubmissionId,
  createdAt: SubmissionFieldsSchema.shape.createdAt,
}))

export type AdminSolutionListQueryResult = z.input<typeof AdminSolutionListQueryResultSchema>

export const AdminSolutionListExportQuerySchema = z.object({
  sort: SortOptionSchema.shape.sort,
  sortBy: z.enum(['createdAt', 'timeUsedMs', 'memoryUsedKb']).default('createdAt'),
  username: z.string().max(30).optional(),
  problemId: z.coerce.number().int().positive().optional(),
  contestId: z.coerce.number().int().positive().optional(),
  status: SubmissionFieldsSchema.shape.status.optional(),
  language: SubmissionFieldsSchema.shape.language.optional(),
})

export type AdminSolutionListExportQuery = z.infer<typeof AdminSolutionListExportQuerySchema>

export const AdminSolutionListExportQueryResultSchema = z.array(z.object({
  id: SubmissionFieldsSchema.shape.id,
  problemId: SubmissionFieldsSchema.shape.problemId,
  userId: SubmissionFieldsSchema.shape.userId,
  contestId: SubmissionFieldsSchema.shape.contestId,
  language: SubmissionFieldsSchema.shape.language,
  status: SubmissionFieldsSchema.shape.status,
  timeUsedMs: SubmissionFieldsSchema.shape.timeUsedMs,
  memoryUsedKb: SubmissionFieldsSchema.shape.memoryUsedKb,
  similarity: SubmissionFieldsSchema.shape.similarity,
  similarSubmissionId: SubmissionFieldsSchema.shape.similarSubmissionId,
  createdAt: SubmissionFieldsSchema.shape.createdAt,
}))

export type AdminSolutionListExportQueryResult = z.input<typeof AdminSolutionListExportQueryResultSchema>

export const AdminNotificationCreatePayloadSchema = z.object({
  title: z.string().min(1).max(30),
  content: z.string().min(1).max(300),
})

export type AdminNotificationCreatePayload = z.infer<typeof AdminNotificationCreatePayloadSchema>

export const AdminGroupDetailQueryResultSchema = z.object({
  id: GroupFieldsSchema.shape.id,
  name: GroupFieldsSchema.shape.name,
  memberIds: z.array(UserFieldsSchema.shape.id),
})

export type AdminGroupDetailQueryResult = z.input<typeof AdminGroupDetailQueryResultSchema>

export const AdminGroupCreatePayloadSchema = z.object({
  name: GroupFieldsSchema.shape.name,
})

export type AdminGroupCreatePayload = z.infer<typeof AdminGroupCreatePayloadSchema>

export const AdminGroupUpdatePayloadSchema = z.object({
  name: GroupFieldsSchema.shape.name,
})

export type AdminGroupUpdatePayload = z.infer<typeof AdminGroupUpdatePayloadSchema>

export const AdminGroupMembersUpdatePayloadSchema = z.object({
  memberIds: z.array(UserFieldsSchema.shape.id),
})

export type AdminGroupMembersUpdatePayload = z.infer<typeof AdminGroupMembersUpdatePayloadSchema>

export const AdminDiscussionUpdatePayloadSchema = z.object({
  authorId: UserFieldsSchema.shape.id.optional(),
  problemId: ProblemFieldsSchema.shape.id.nullable().optional(),
  contestId: ContestFieldsSchema.shape.id.nullable().optional(),
  type: DiscussionFieldsSchema.shape.type.optional(),
  isPinned: DiscussionFieldsSchema.shape.isPinned.optional(),
  title: DiscussionFieldsSchema.shape.title.optional(),
})

export type AdminDiscussionUpdatePayload = z.infer<typeof AdminDiscussionUpdatePayloadSchema>

export const AdminCommentUpdatePayloadSchema = z.object({
  isHidden: CommentFieldsSchema.shape.isHidden.optional(),
})

export type AdminCommentUpdatePayload = z.infer<typeof AdminCommentUpdatePayloadSchema>

export const AvatarPresetsEditPayloadSchema = z.object({
  avatarPresets: z.array(UserAvatarSchema),
})

export type AvatarPresetsEditPayload = z.infer<typeof AvatarPresetsEditPayloadSchema>

export const AdminTagListQueryResultSchema = z.array(TagFieldsSchema)

export type AdminTagListQueryResult = z.input<typeof AdminTagListQueryResultSchema>

export const AdminTagCreatePayloadSchema = z.object({
  name: TagFieldsSchema.shape.name,
  color: TagFieldsSchema.shape.color,
})

export type AdminTagCreatePayload = z.infer<typeof AdminTagCreatePayloadSchema>

export const AdminTagUpdatePayloadSchema = z.object({
  name: TagFieldsSchema.shape.name.optional(),
  color: TagFieldsSchema.shape.color.optional(),
})

export type AdminTagUpdatePayload = z.infer<typeof AdminTagUpdatePayloadSchema>

export const AdminFileListQuerySchema = z.object({
  page: PaginationSchema.shape.page,
  pageSize: PaginationSchema.shape.pageSize.default(30),
  sort: SortOptionSchema.shape.sort,
  sortBy: z.enum(['createdAt', 'sizeBytes']).default('createdAt'),
  ownerId: z.coerce.number().int().positive().optional(),
})

export type AdminFileListQuery = z.infer<typeof AdminFileListQuerySchema>

export const AdminFileListQueryResultSchema = PaginatedResultSchema(z.object({
  ownerId: UserFieldsSchema.shape.id,
  storageKey: z.string().min(1),
  originalName: z.string().min(1),
  sizeBytes: z.int().nonnegative(),
  createdAt: FileFieldsSchema.shape.createdAt,
}))

export type AdminFileListQueryResult = z.input<typeof AdminFileListQueryResultSchema>

export const AdminPostListQuerySchema = z.object({
  page: PaginationSchema.shape.page,
  pageSize: PaginationSchema.shape.pageSize.default(30),
  sort: SortOptionSchema.shape.sort,
  sortBy: z.enum(['publishesAt', 'createdAt', 'updatedAt']).default('publishesAt'),
  title: z.string().max(TITLE_LENGTH_MAX).optional(),
  isPublished: z.stringbool().optional(),
  isPinned: z.stringbool().optional(),
  isHidden: z.stringbool().optional(),
})

export type AdminPostListQuery = z.infer<typeof AdminPostListQuerySchema>

export const AdminPostListQueryResultSchema = PaginatedResultSchema(z.object({
  id: PostFieldsSchema.shape.id,
  slug: PostFieldsSchema.shape.slug,
  title: PostFieldsSchema.shape.title,
  publishesAt: PostFieldsSchema.shape.publishesAt,
  isPublished: PostFieldsSchema.shape.isPublished,
  isPinned: PostFieldsSchema.shape.isPinned,
  isHidden: PostFieldsSchema.shape.isHidden,
  createdAt: PostFieldsSchema.shape.createdAt,
  updatedAt: PostFieldsSchema.shape.updatedAt,
}))

export type AdminPostListQueryResult = z.input<typeof AdminPostListQueryResultSchema>

export const AdminPostDetailQueryResultSchema = z.object({
  id: PostFieldsSchema.shape.id,
  slug: PostFieldsSchema.shape.slug,
  title: PostFieldsSchema.shape.title,
  content: PostFieldsSchema.shape.content,
  publishesAt: PostFieldsSchema.shape.publishesAt,
  isPublished: PostFieldsSchema.shape.isPublished,
  isPinned: PostFieldsSchema.shape.isPinned,
  isHidden: PostFieldsSchema.shape.isHidden,
  createdAt: PostFieldsSchema.shape.createdAt,
  updatedAt: PostFieldsSchema.shape.updatedAt,
})

export type AdminPostDetailQueryResult = z.input<typeof AdminPostDetailQueryResultSchema>

export const AdminPostCreatePayloadSchema = z.object({
  title: PostFieldsSchema.shape.title,
})

export type AdminPostCreatePayload = z.infer<typeof AdminPostCreatePayloadSchema>

export const AdminPostUpdatePayloadSchema = z.object({
  slug: PostFieldsSchema.shape.slug.optional(),
  title: PostFieldsSchema.shape.title.optional(),
  content: PostFieldsSchema.shape.content.optional(),
  publishesAt: PostFieldsSchema.shape.publishesAt.optional(),
  isPublished: PostFieldsSchema.shape.isPublished.optional(),
  isPinned: PostFieldsSchema.shape.isPinned.optional(),
  isHidden: PostFieldsSchema.shape.isHidden.optional(),
})

export type AdminPostUpdatePayload = z.infer<typeof AdminPostUpdatePayloadSchema>

export const AdminAccountBatchRegisterPayloadSchema = z.array(z.object({
  username: UserFieldsSchema.shape.username,
  password: z.string(),
  nickname: UserFieldsSchema.shape.nickname.optional(),
})).min(1).max(1000)

export type AdminAccountBatchRegisterPayload = z.infer<typeof AdminAccountBatchRegisterPayloadSchema>

export const AdminAccountBatchRegisterResultSchema = z.object({
  total: z.int().nonnegative(),
  created: z.int().nonnegative(),
  failed: z.int().nonnegative(),
  results: z.array(z.object({
    username: UserFieldsSchema.shape.username,
    success: z.boolean(),
    message: z.string().optional(),
  })),
})

export type AdminAccountBatchRegisterResult = z.input<typeof AdminAccountBatchRegisterResultSchema>
