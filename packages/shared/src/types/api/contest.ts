import { z } from 'zod'
import { ParticipationStatus } from '@/consts/index.js'
import { ContestFieldsSchema, ContestParticipationFieldsSchema } from '../fields/contest.js'
import { GroupFieldsSchema } from '../fields/group.js'
import { ProblemFieldsSchema } from '../fields/problem.js'
import { SubmissionFieldsSchema } from '../fields/submission.js'
import { UserFieldsSchema } from '../fields/user.js'
import { ContestRanklistSchema } from '../service/contest.js'
import { PaginatedResultSchema, PaginationSchema, SortOptionSchema } from './utils.js'

const ContestIpWhitelistEntrySchema = z.object({
  cidr: z.union([z.cidrv4(), z.cidrv6()]),
  comment: z.string().max(100).nullable(),
})

const ContestParticipationManageableStatusSchema = z.enum(ParticipationStatus)
  .exclude([
    ParticipationStatus.NOT_APPLIED,
    ParticipationStatus.PENDING,
    ParticipationStatus.REJECTED,
  ])

const SubmissionListItemSchema = z.object({
  id: SubmissionFieldsSchema.shape.id,
  problemId: SubmissionFieldsSchema.shape.problemId,
  contestId: SubmissionFieldsSchema.shape.contestId,
  user: z.object({
    id: UserFieldsSchema.shape.id,
    username: UserFieldsSchema.shape.username,
    nickname: UserFieldsSchema.shape.nickname,
  }),
  language: SubmissionFieldsSchema.shape.language,
  status: SubmissionFieldsSchema.shape.status,
  timeUsedMs: SubmissionFieldsSchema.shape.timeUsedMs,
  memoryUsedKb: SubmissionFieldsSchema.shape.memoryUsedKb,
  similarity: SubmissionFieldsSchema.shape.similarity,
  similarSubmissionId: SubmissionFieldsSchema.shape.similarSubmissionId,
  createdAt: SubmissionFieldsSchema.shape.createdAt,
})

export const ContestListQuerySchema = z.object({
  page: PaginationSchema.shape.page,
  pageSize: PaginationSchema.shape.pageSize.default(30),
  sort: SortOptionSchema.shape.sort,
  sortBy: z.enum(['createdAt', 'startsAt', 'endsAt']).default('createdAt'),
  title: z.string().max(30).optional(),
  courseId: z.coerce.number().int().positive().optional(),
})

export type ContestListQuery = z.infer<typeof ContestListQuerySchema>

export const ContestListQueryResultSchema = PaginatedResultSchema(z.object({
  id: ContestFieldsSchema.shape.id,
  title: ContestFieldsSchema.shape.title,
  startsAt: ContestFieldsSchema.shape.startsAt,
  endsAt: ContestFieldsSchema.shape.endsAt,
  isPublic: ContestFieldsSchema.shape.isPublic,
  isHidden: ContestFieldsSchema.shape.isHidden.optional(),
}))

export type ContestListQueryResult = z.input<typeof ContestListQueryResultSchema>

export const ContestParticipationQueryResultSchema = z.object({
  isJury: z.boolean(),
  participationStatus: ContestParticipationFieldsSchema.shape.status
    .or(z.literal(ParticipationStatus.NOT_APPLIED)),
  canParticipate: z.boolean(),
  canParticipateByPassword: z.boolean(),
  isIpBlocked: z.boolean(),
  hasStarted: z.boolean(),
  hasEnded: z.boolean(),
})

export type ContestParticipationQueryResult = z.input<typeof ContestParticipationQueryResultSchema>

export const ContestParticipatePayloadSchema = z.object({
  password: z.string().optional(),
})

export type ContestParticipatePayload = z.infer<typeof ContestParticipatePayloadSchema>

export type ContestParticipationManageableStatus = z.infer<typeof ContestParticipationManageableStatusSchema>

export const ContestParticipantListQuerySchema = z.object({
  page: PaginationSchema.shape.page,
  pageSize: PaginationSchema.shape.pageSize.default(30),
  sort: SortOptionSchema.shape.sort,
  sortBy: z.enum(['createdAt', 'updatedAt', 'status']).default('updatedAt'),
  username: z.string().max(30).optional(),
  status: ContestParticipationManageableStatusSchema.optional(),
})

export type ContestParticipantListQuery = z.infer<typeof ContestParticipantListQuerySchema>

export const ContestParticipantListQueryResultSchema = PaginatedResultSchema(z.object({
  userId: UserFieldsSchema.shape.id,
  username: UserFieldsSchema.shape.username,
  nickname: UserFieldsSchema.shape.nickname,
  status: ContestParticipationFieldsSchema.shape.status,
  createdAt: ContestParticipationFieldsSchema.shape.createdAt,
  updatedAt: ContestParticipationFieldsSchema.shape.updatedAt,
}))

export type ContestParticipantListQueryResult = z.input<typeof ContestParticipantListQueryResultSchema>

export const ContestParticipantUpdatePayloadSchema = z.object({
  status: ContestParticipationManageableStatusSchema,
})

export type ContestParticipantUpdatePayload = z.infer<typeof ContestParticipantUpdatePayloadSchema>

export const ContestDetailQueryResultSchema = z.object({
  id: ContestFieldsSchema.shape.id,
  title: ContestFieldsSchema.shape.title,
  startsAt: ContestFieldsSchema.shape.startsAt,
  endsAt: ContestFieldsSchema.shape.endsAt,
  isPublic: ContestFieldsSchema.shape.isPublic,
  isHidden: ContestFieldsSchema.shape.isHidden,
  isJury: z.boolean(),
  allowedLanguages: ContestFieldsSchema.shape.allowedLanguages,
  allowEarlyExit: ContestFieldsSchema.shape.allowEarlyExit,
  problems: z.array(z.object({
    position: z.int().positive(),
    problemId: ProblemFieldsSchema.shape.id,
    title: ProblemFieldsSchema.shape.title,
    submitterCount: z.int().nonnegative(),
    solverCount: z.int().nonnegative(),
    isAttempted: z.boolean(),
    isSolved: z.boolean(),
  })),
  labelingStyle: ContestFieldsSchema.shape.labelingStyle,
  course: z.object({
    id: z.int().positive(),
    name: z.string(),
  }).nullable(),
})

export type ContestDetailQueryResult = z.input<typeof ContestDetailQueryResultSchema>

export const ContestCreatePayloadSchema = z.object({
  title: ContestFieldsSchema.shape.title,
  startsAt: ContestFieldsSchema.shape.startsAt,
  endsAt: ContestFieldsSchema.shape.endsAt,
  isHidden: ContestFieldsSchema.shape.isHidden,
  isPublic: ContestFieldsSchema.shape.isPublic,
  courseId: ContestFieldsSchema.shape.courseId.optional(),
})

export type ContestCreatePayload = z.infer<typeof ContestCreatePayloadSchema>

export const ContestCreateResultSchema = z.object({
  id: ContestFieldsSchema.shape.id,
})

export type ContestCreateResult = z.input<typeof ContestCreateResultSchema>

export const ContestConfigQueryResultSchema = z.object({
  id: ContestFieldsSchema.shape.id,
  title: ContestFieldsSchema.shape.title,
  startsAt: ContestFieldsSchema.shape.startsAt,
  endsAt: ContestFieldsSchema.shape.endsAt,
  scoreboardFrozenAt: ContestFieldsSchema.shape.scoreboardFrozenAt,
  scoreboardUnfrozenAt: ContestFieldsSchema.shape.scoreboardUnfrozenAt,
  isHidden: ContestFieldsSchema.shape.isHidden,
  isLocked: ContestFieldsSchema.shape.isLocked,
  isPublic: ContestFieldsSchema.shape.isPublic,
  allowEarlyExit: ContestFieldsSchema.shape.allowEarlyExit,
  password: z.string().nullable(),
  allowedUsers: z.array(z.object({
    id: UserFieldsSchema.shape.id,
    username: UserFieldsSchema.shape.username,
    nickname: UserFieldsSchema.shape.nickname,
  })),
  allowedGroups: z.array(z.object({
    id: GroupFieldsSchema.shape.id,
    name: GroupFieldsSchema.shape.name,
  })),
  ipWhitelist: z.array(ContestIpWhitelistEntrySchema),
  ipWhitelistEnabled: ContestFieldsSchema.shape.ipWhitelistEnabled,
  problems: z.array(z.object({
    position: z.int().positive(),
    problemId: ProblemFieldsSchema.shape.id,
    title: ProblemFieldsSchema.shape.title,
  })),
  allowedLanguages: ContestFieldsSchema.shape.allowedLanguages,
  labelingStyle: ContestFieldsSchema.shape.labelingStyle,
  course: z.object({
    id: z.int().positive(),
    name: z.string(),
  }).nullable(),
})

export type ContestConfigQueryResult = z.input<typeof ContestConfigQueryResultSchema>

export const ContestConfigEditPayloadSchema = z.object({
  title: ContestFieldsSchema.shape.title,
  startsAt: ContestFieldsSchema.shape.startsAt,
  endsAt: ContestFieldsSchema.shape.endsAt,
  scoreboardFrozenAt: ContestFieldsSchema.shape.scoreboardFrozenAt,
  scoreboardUnfrozenAt: ContestFieldsSchema.shape.scoreboardUnfrozenAt,
  isHidden: ContestFieldsSchema.shape.isHidden,
  isLocked: ContestFieldsSchema.shape.isLocked,
  isPublic: ContestFieldsSchema.shape.isPublic,
  allowEarlyExit: ContestFieldsSchema.shape.allowEarlyExit,
  password: z.string().nullable(),
  allowedUserIds: z.array(UserFieldsSchema.shape.id),
  allowedGroupIds: z.array(GroupFieldsSchema.shape.id),
  ipWhitelist: z.array(ContestIpWhitelistEntrySchema),
  ipWhitelistEnabled: ContestFieldsSchema.shape.ipWhitelistEnabled,
  problemIds: z.array(ProblemFieldsSchema.shape.id),
  allowedLanguages: ContestFieldsSchema.shape.allowedLanguages,
  labelingStyle: ContestFieldsSchema.shape.labelingStyle,
  courseId: ContestFieldsSchema.shape.courseId,
}).partial()

export type ContestConfigEditPayload = z.infer<typeof ContestConfigEditPayloadSchema>

export const ContestSolutionListQuerySchema = z.object({
  page: PaginationSchema.shape.page,
  pageSize: PaginationSchema.shape.pageSize.default(30),
  sort: SortOptionSchema.shape.sort,
  sortBy: z.enum(['createdAt', 'timeUsedMs', 'memoryUsedKb']).default('createdAt'),
  username: z.string().max(30).optional(),
  problemId: z.coerce.number().int().positive().optional(),
  status: SubmissionFieldsSchema.shape.status.optional(),
  language: SubmissionFieldsSchema.shape.language.optional(),
})

export type ContestSolutionListQuery = z.infer<typeof ContestSolutionListQuerySchema>

export const ContestSolutionListQueryResultSchema = PaginatedResultSchema(SubmissionListItemSchema)

export type ContestSolutionListQueryResult = z.input<typeof ContestSolutionListQueryResultSchema>

export const ContestSolutionListExportQuerySchema = ContestSolutionListQuerySchema.omit({
  page: true,
  pageSize: true,
})

export type ContestSolutionListExportQuery = z.infer<typeof ContestSolutionListExportQuerySchema>

export const ContestSolutionListExportQueryResultSchema = z.array(SubmissionListItemSchema)

export type ContestSolutionListExportQueryResult = z.input<typeof ContestSolutionListExportQueryResultSchema>

export const ContestRanklistQueryResultSchema = ContestRanklistSchema

export type ContestRanklistQueryResult = z.input<typeof ContestRanklistQueryResultSchema>
