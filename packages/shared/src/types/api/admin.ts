import { z } from 'zod'
import {
  DiscussionType,
  JudgeStatus,
  Language,
  OAuthProvider,
  TITLE_LENGTH_MAX,
  UserPrivilege,
} from '@/consts/index.js'
import { stringToInt } from '../codec.js'
import {
  CommentModelSchema,
  ContestModelSchema,
  DiscussionModelSchema,
  FileModelSchema,
  GroupModelSchema,
  OAuthModelSchema,
  PostModelSchema,
  ProblemModelSchema,
  SolutionModelSchema,
  TagModelSchema,
  UserModelSchema,
} from '../model/index.js'
import { UserAvatarSchema } from '../model/user.js'
import {
  PaginatedSchema,
  PaginationSchema,
  SortOptionSchema,
} from './utils.js'

export const AdminUserListQuerySchema = z.object({
  page: PaginationSchema.shape.page,
  pageSize: PaginationSchema.shape.pageSize.default(30),
  sort: SortOptionSchema.shape.sort,
  sortBy: z.enum(['uid', 'createdAt', 'lastVisitedAt']).default('lastVisitedAt'),
  keyword: z.string().max(30).optional(),
  privilege: stringToInt.pipe(z.enum(UserPrivilege)).optional(),
})

export type AdminUserListQuery = z.infer<typeof AdminUserListQuerySchema>

export const AdminUserListQueryResultSchema = PaginatedSchema(z.object({
  uid: UserModelSchema.shape.uid,
  privilege: UserModelSchema.shape.privilege,
  nick: UserModelSchema.shape.nick.optional(),
  createdAt: UserModelSchema.shape.createdAt,
  lastVisitedAt: UserModelSchema.shape.lastVisitedAt.optional(),
}))

export type AdminUserListQueryResult = z.input<typeof AdminUserListQueryResultSchema>

export const AdminUserDetailQueryResultSchema = z.object({
  uid: UserModelSchema.shape.uid,
  privilege: UserModelSchema.shape.privilege,
  nick: UserModelSchema.shape.nick,
  avatar: UserModelSchema.shape.avatar,
  motto: UserModelSchema.shape.motto,
  mail: UserModelSchema.shape.mail,
  school: UserModelSchema.shape.school,
  storageQuota: UserModelSchema.shape.storageQuota,
  lastRequestId: UserModelSchema.shape.lastRequestId,
  lastVisitedAt: UserModelSchema.shape.lastVisitedAt,
  createdAt: UserModelSchema.shape.createdAt,
})

export type AdminUserDetailQueryResult = z.input<typeof AdminUserDetailQueryResultSchema>

export const AdminUserEditPayloadSchema = z.object({
  privilege: z.enum(UserPrivilege).optional(),
  nick: UserModelSchema.shape.nick.optional(),
  avatar: UserModelSchema.shape.avatar.optional(),
  motto: UserModelSchema.shape.motto.optional(),
  mail: UserModelSchema.shape.mail.optional(),
  school: UserModelSchema.shape.school.optional(),
  storageQuota: UserModelSchema.shape.storageQuota.optional(),
})

export type AdminUserEditPayload = z.infer<typeof AdminUserEditPayloadSchema>

export const AdminUserChangePasswordPayloadSchema = z.object({
  newPassword: z.base64(),
})

export type AdminUserChangePasswordPayload = z.infer<typeof AdminUserChangePasswordPayloadSchema>

export const AdminUserOAuthQueryResultSchema = z.record(
  z.enum(OAuthProvider),
  z.object({
    providerId: OAuthModelSchema.shape.providerId,
    displayName: OAuthModelSchema.shape.displayName,
    createdAt: OAuthModelSchema.shape.createdAt,
  }).nullable(),
)

export type AdminUserOAuthQueryResult = z.input<typeof AdminUserOAuthQueryResultSchema>

export const AdminSolutionListQuerySchema = z.object({
  page: PaginationSchema.shape.page,
  pageSize: PaginationSchema.shape.pageSize.default(30),
  sort: SortOptionSchema.shape.sort,
  sortBy: z.enum(['createdAt', 'time', 'memory']).default('createdAt'),
  user: z.string().max(30).optional(),
  problem: stringToInt.pipe(z.int().nonnegative()).optional(),
  contest: stringToInt.pipe(z.union([z.int().nonnegative(), z.literal(-1)])).optional(),
  judge: stringToInt.pipe(z.enum(JudgeStatus)).optional(),
  language: stringToInt.pipe(z.enum(Language)).optional(),
})

export type AdminSolutionListQuery = z.infer<typeof AdminSolutionListQuerySchema>

export const AdminSolutionListQueryResultSchema = PaginatedSchema(z.object({
  sid: SolutionModelSchema.shape.sid,
  pid: SolutionModelSchema.shape.pid,
  uid: SolutionModelSchema.shape.uid,
  mid: SolutionModelSchema.shape.mid,
  language: SolutionModelSchema.shape.language,
  judge: SolutionModelSchema.shape.judge,
  time: SolutionModelSchema.shape.time,
  memory: SolutionModelSchema.shape.memory,
  sim: SolutionModelSchema.shape.sim,
  sim_s_id: SolutionModelSchema.shape.sim_s_id,
  createdAt: SolutionModelSchema.shape.createdAt,
}))

export type AdminSolutionListQueryResult = z.input<typeof AdminSolutionListQueryResultSchema>

export const AdminSolutionListExportQuerySchema = z.object({
  sort: SortOptionSchema.shape.sort,
  sortBy: z.enum(['createdAt', 'time', 'memory']).default('createdAt'),
  user: z.string().max(30).optional(),
  problem: stringToInt.pipe(z.int().nonnegative()).optional(),
  contest: stringToInt.pipe(z.union([z.int().nonnegative(), z.literal(-1)])).optional(),
  judge: stringToInt.pipe(z.enum(JudgeStatus)).optional(),
  language: stringToInt.pipe(z.enum(Language)).optional(),
})

export type AdminSolutionListExportQuery = z.infer<typeof AdminSolutionListExportQuerySchema>

export const AdminSolutionListExportQueryResultSchema = z.array(z.object({
  sid: SolutionModelSchema.shape.sid,
  pid: SolutionModelSchema.shape.pid,
  uid: SolutionModelSchema.shape.uid,
  mid: SolutionModelSchema.shape.mid,
  language: SolutionModelSchema.shape.language,
  judge: SolutionModelSchema.shape.judge,
  time: SolutionModelSchema.shape.time,
  memory: SolutionModelSchema.shape.memory,
  sim: SolutionModelSchema.shape.sim,
  sim_s_id: SolutionModelSchema.shape.sim_s_id,
  createdAt: SolutionModelSchema.shape.createdAt,
}))

export type AdminSolutionListExportQueryResult = z.input<typeof AdminSolutionListExportQueryResultSchema>

export const AdminNotificationCreatePayloadSchema = z.object({
  title: z.string().min(1).max(30),
  content: z.string().min(1).max(300),
})

export type AdminNotificationCreatePayload = z.infer<typeof AdminNotificationCreatePayloadSchema>

export const AdminGroupDetailQueryResultSchema = z.object({
  groupId: GroupModelSchema.shape.gid,
  name: GroupModelSchema.shape.title,
  members: z.array(UserModelSchema.shape.uid),
})

export type AdminGroupDetailQueryResult = z.input<typeof AdminGroupDetailQueryResultSchema>

export const AdminGroupCreatePayloadSchema = z.object({
  name: GroupModelSchema.shape.title,
})

export type AdminGroupCreatePayload = z.infer<typeof AdminGroupCreatePayloadSchema>

export const AdminGroupUpdatePayloadSchema = z.object({
  name: GroupModelSchema.shape.title,
})

export type AdminGroupUpdatePayload = z.infer<typeof AdminGroupUpdatePayloadSchema>

export const AdminGroupMembersUpdatePayloadSchema = z.object({
  members: z.array(UserModelSchema.shape.uid),
})

export type AdminGroupMembersUpdatePayload = z.infer<typeof AdminGroupMembersUpdatePayloadSchema>

export const AdminDiscussionUpdatePayloadSchema = z.object({
  author: UserModelSchema.shape.uid.optional(),
  problem: ProblemModelSchema.shape.pid.nullable().optional(),
  contest: ContestModelSchema.shape.contestId.nullable().optional(),
  type: z.enum(DiscussionType).optional(),
  pinned: DiscussionModelSchema.shape.pinned.optional(),
  title: DiscussionModelSchema.shape.title.optional(),
})

export type AdminDiscussionUpdatePayload = z.infer<typeof AdminDiscussionUpdatePayloadSchema>

export const AdminCommentUpdatePayloadSchema = z.object({
  hidden: CommentModelSchema.shape.hidden.optional(),
})

export type AdminCommentUpdatePayload = z.infer<typeof AdminCommentUpdatePayloadSchema>

export const AvatarPresetsEditPayloadSchema = z.object({
  avatarPresets: z.array(UserAvatarSchema),
})

export type AvatarPresetsEditPayload = z.infer<typeof AvatarPresetsEditPayloadSchema>

export const AdminTagListQueryResultSchema = z.array(TagModelSchema)

export type AdminTagListQueryResult = z.input<typeof AdminTagListQueryResultSchema>

export const AdminTagCreatePayloadSchema = z.object({
  name: TagModelSchema.shape.name,
  color: TagModelSchema.shape.color,
})

export type AdminTagCreatePayload = z.infer<typeof AdminTagCreatePayloadSchema>

export const AdminTagUpdatePayloadSchema = z.object({
  name: TagModelSchema.shape.name.optional(),
  color: TagModelSchema.shape.color.optional(),
})

export type AdminTagUpdatePayload = z.infer<typeof AdminTagUpdatePayloadSchema>

export const AdminFileListQuerySchema = z.object({
  page: PaginationSchema.shape.page,
  pageSize: PaginationSchema.shape.pageSize.default(30),
  sort: SortOptionSchema.shape.sort,
  sortBy: z.enum(['createdAt', 'sizeBytes']).default('createdAt'),
  uploader: UserModelSchema.shape.uid.optional(),
})

export type AdminFileListQuery = z.infer<typeof AdminFileListQuerySchema>

export const AdminFileListQueryResultSchema = PaginatedSchema(z.object({
  owner: UserModelSchema.shape.uid,
  storageKey: z.string().min(1),
  originalName: z.string().min(1),
  sizeBytes: z.int().nonnegative(),
  createdAt: FileModelSchema.shape.createdAt,
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

export const AdminPostListQueryResultSchema = PaginatedSchema(z.object({
  slug: PostModelSchema.shape.slug,
  title: PostModelSchema.shape.title,
  publishesAt: PostModelSchema.shape.publishesAt,
  isPublished: PostModelSchema.shape.isPublished,
  isPinned: PostModelSchema.shape.isPinned,
  isHidden: PostModelSchema.shape.isHidden,
  createdAt: PostModelSchema.shape.createdAt,
  updatedAt: PostModelSchema.shape.updatedAt,
}))

export type AdminPostListQueryResult = z.input<typeof AdminPostListQueryResultSchema>

export const AdminPostDetailQueryResultSchema = z.object({
  slug: PostModelSchema.shape.slug,
  title: PostModelSchema.shape.title,
  content: PostModelSchema.shape.content,
  publishesAt: PostModelSchema.shape.publishesAt,
  isPublished: PostModelSchema.shape.isPublished,
  isPinned: PostModelSchema.shape.isPinned,
  isHidden: PostModelSchema.shape.isHidden,
  createdAt: PostModelSchema.shape.createdAt,
  updatedAt: PostModelSchema.shape.updatedAt,
})

export type AdminPostDetailQueryResult = z.input<typeof AdminPostDetailQueryResultSchema>

export const AdminPostCreatePayloadSchema = z.object({
  title: PostModelSchema.shape.title,
})

export type AdminPostCreatePayload = z.infer<typeof AdminPostCreatePayloadSchema>

export const AdminPostUpdatePayloadSchema = z.object({
  slug: PostModelSchema.shape.slug.optional(),
  title: PostModelSchema.shape.title.optional(),
  content: PostModelSchema.shape.content.optional(),
  publishesAt: PostModelSchema.shape.publishesAt.optional(),
  isPublished: PostModelSchema.shape.isPublished.optional(),
  isPinned: PostModelSchema.shape.isPinned.optional(),
  isHidden: PostModelSchema.shape.isHidden.optional(),
})

export type AdminPostUpdatePayload = z.infer<typeof AdminPostUpdatePayloadSchema>

export const AdminAccountBatchRegisterPayloadSchema = z.array(z.object({
  username: UserModelSchema.shape.uid,
  password: z.string(),
  nick: UserModelSchema.shape.nick.optional(),
})).min(1).max(1000)

export type AdminAccountBatchRegisterPayload = z.infer<typeof AdminAccountBatchRegisterPayloadSchema>

export const AdminAccountBatchRegisterResultSchema = z.object({
  total: z.int().nonnegative(),
  created: z.int().nonnegative(),
  failed: z.int().nonnegative(),
  results: z.array(z.object({
    username: UserModelSchema.shape.uid,
    success: z.boolean(),
    message: z.string().optional(),
  })),
})

export type AdminAccountBatchRegisterResult = z.input<typeof AdminAccountBatchRegisterResultSchema>
