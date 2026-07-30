import { z } from 'zod'
import { ParticipationStatus } from '@/consts/index.js'
import { ContestModelSchema, ContestParticipationModelSchema } from '../model/contest.js'
import { GroupModelSchema } from '../model/group.js'
import { ProblemModelSchema } from '../model/problem.js'
import { SolutionModelSchema } from '../model/solution.js'
import { UserModelSchema } from '../model/user.js'
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
  id: SolutionModelSchema.shape.id,
  problemId: SolutionModelSchema.shape.problemId,
  userId: SolutionModelSchema.shape.userId,
  contestId: SolutionModelSchema.shape.contestId,
  language: SolutionModelSchema.shape.language,
  status: SolutionModelSchema.shape.status,
  timeUsedMs: SolutionModelSchema.shape.timeUsedMs,
  memoryUsedKb: SolutionModelSchema.shape.memoryUsedKb,
  similarity: SolutionModelSchema.shape.similarity,
  similarSubmissionId: SolutionModelSchema.shape.similarSubmissionId,
  createdAt: SolutionModelSchema.shape.createdAt,
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
  id: ContestModelSchema.shape.id,
  title: ContestModelSchema.shape.title,
  startsAt: ContestModelSchema.shape.startsAt,
  endsAt: ContestModelSchema.shape.endsAt,
  isPublic: ContestModelSchema.shape.isPublic,
  isHidden: ContestModelSchema.shape.isHidden.optional(),
}))

export type ContestListQueryResult = z.input<typeof ContestListQueryResultSchema>

export const ContestParticipationQueryResultSchema = z.object({
  isJury: z.boolean(),
  participationStatus: ContestParticipationModelSchema.shape.status
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
  userId: UserModelSchema.shape.id,
  username: UserModelSchema.shape.username,
  nickname: UserModelSchema.shape.nickname,
  status: ContestParticipationModelSchema.shape.status,
  createdAt: ContestParticipationModelSchema.shape.createdAt,
  updatedAt: ContestParticipationModelSchema.shape.updatedAt,
}))

export type ContestParticipantListQueryResult = z.input<typeof ContestParticipantListQueryResultSchema>

export const ContestParticipantUpdatePayloadSchema = z.object({
  status: ContestParticipationManageableStatusSchema,
})

export type ContestParticipantUpdatePayload = z.infer<typeof ContestParticipantUpdatePayloadSchema>

export const ContestDetailQueryResultSchema = z.object({
  id: ContestModelSchema.shape.id,
  title: ContestModelSchema.shape.title,
  startsAt: ContestModelSchema.shape.startsAt,
  endsAt: ContestModelSchema.shape.endsAt,
  isPublic: ContestModelSchema.shape.isPublic,
  isHidden: ContestModelSchema.shape.isHidden,
  isJury: z.boolean(),
  allowedLanguages: ContestModelSchema.shape.allowedLanguages,
  allowEarlyExit: ContestModelSchema.shape.allowEarlyExit,
  problems: z.array(z.object({
    position: z.int().positive(),
    problemId: ProblemModelSchema.shape.id,
    title: ProblemModelSchema.shape.title,
    submitterCount: z.int().nonnegative(),
    solverCount: z.int().nonnegative(),
    isAttempted: z.boolean(),
    isSolved: z.boolean(),
  })),
  labelingStyle: ContestModelSchema.shape.labelingStyle,
  course: z.object({
    id: z.int().positive(),
    name: z.string(),
  }).nullable(),
})

export type ContestDetailQueryResult = z.input<typeof ContestDetailQueryResultSchema>

export const ContestCreatePayloadSchema = z.object({
  title: ContestModelSchema.shape.title,
  startsAt: ContestModelSchema.shape.startsAt,
  endsAt: ContestModelSchema.shape.endsAt,
  isHidden: ContestModelSchema.shape.isHidden,
  isPublic: ContestModelSchema.shape.isPublic,
  courseId: ContestModelSchema.shape.courseId.optional(),
})

export type ContestCreatePayload = z.infer<typeof ContestCreatePayloadSchema>

export const ContestConfigQueryResultSchema = z.object({
  id: ContestModelSchema.shape.id,
  title: ContestModelSchema.shape.title,
  startsAt: ContestModelSchema.shape.startsAt,
  endsAt: ContestModelSchema.shape.endsAt,
  scoreboardFrozenAt: ContestModelSchema.shape.scoreboardFrozenAt,
  scoreboardUnfrozenAt: ContestModelSchema.shape.scoreboardUnfrozenAt,
  isHidden: ContestModelSchema.shape.isHidden,
  isLocked: ContestModelSchema.shape.isLocked,
  isPublic: ContestModelSchema.shape.isPublic,
  allowEarlyExit: ContestModelSchema.shape.allowEarlyExit,
  password: z.string().nullable(),
  allowedUsers: z.array(z.object({
    id: UserModelSchema.shape.id,
    username: UserModelSchema.shape.username,
    nickname: UserModelSchema.shape.nickname,
  })),
  allowedGroups: z.array(z.object({
    id: GroupModelSchema.shape.id,
    name: GroupModelSchema.shape.name,
  })),
  ipWhitelist: z.array(ContestIpWhitelistEntrySchema),
  ipWhitelistEnabled: ContestModelSchema.shape.ipWhitelistEnabled,
  problems: z.array(z.object({
    position: z.int().positive(),
    problemId: ProblemModelSchema.shape.id,
    title: ProblemModelSchema.shape.title,
  })),
  allowedLanguages: ContestModelSchema.shape.allowedLanguages,
  labelingStyle: ContestModelSchema.shape.labelingStyle,
  course: z.object({
    id: z.int().positive(),
    name: z.string(),
  }).nullable(),
})

export type ContestConfigQueryResult = z.input<typeof ContestConfigQueryResultSchema>

export const ContestConfigEditPayloadSchema = z.object({
  title: ContestModelSchema.shape.title,
  startsAt: ContestModelSchema.shape.startsAt,
  endsAt: ContestModelSchema.shape.endsAt,
  scoreboardFrozenAt: ContestModelSchema.shape.scoreboardFrozenAt,
  scoreboardUnfrozenAt: ContestModelSchema.shape.scoreboardUnfrozenAt,
  isHidden: ContestModelSchema.shape.isHidden,
  isLocked: ContestModelSchema.shape.isLocked,
  isPublic: ContestModelSchema.shape.isPublic,
  allowEarlyExit: ContestModelSchema.shape.allowEarlyExit,
  password: z.string().nullable(),
  allowedUserIds: z.array(UserModelSchema.shape.id),
  allowedGroupIds: z.array(GroupModelSchema.shape.id),
  ipWhitelist: z.array(ContestIpWhitelistEntrySchema),
  ipWhitelistEnabled: ContestModelSchema.shape.ipWhitelistEnabled,
  problemIds: z.array(ProblemModelSchema.shape.id),
  allowedLanguages: ContestModelSchema.shape.allowedLanguages,
  labelingStyle: ContestModelSchema.shape.labelingStyle,
  courseId: ContestModelSchema.shape.courseId,
}).partial()

export type ContestConfigEditPayload = z.infer<typeof ContestConfigEditPayloadSchema>

export const ContestSolutionListQuerySchema = z.object({
  page: PaginationSchema.shape.page,
  pageSize: PaginationSchema.shape.pageSize.default(30),
  sort: SortOptionSchema.shape.sort,
  sortBy: z.enum(['createdAt', 'timeUsedMs', 'memoryUsedKb']).default('createdAt'),
  username: z.string().max(30).optional(),
  problemId: z.coerce.number().int().positive().optional(),
  status: SolutionModelSchema.shape.status.optional(),
  language: SolutionModelSchema.shape.language.optional(),
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
