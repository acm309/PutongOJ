import { z } from 'zod'
import { JudgeStatus, Language, ParticipationStatus } from '@/consts/index.js'
import { stringToInt } from '../codec.js'
import { ContestModelSchema } from '../model/contest.js'
import { GroupModelSchema } from '../model/group.js'
import { ProblemModelSchema } from '../model/problem.js'
import { SolutionModelSchema } from '../model/solution.js'
import { UserModelSchema } from '../model/user.js'
import { PaginatedSchema, PaginationSchema, SortOptionSchema } from './utils.js'

export const ContestListQuerySchema = z.object({
  page: PaginationSchema.shape.page,
  pageSize: PaginationSchema.shape.pageSize.default(30),
  sort: SortOptionSchema.shape.sort,
  sortBy: z.enum(['createdAt', 'startsAt', 'endsAt']).default('createdAt'),
  title: z.string().max(30).optional(),
  course: z.number().nonnegative().optional(),
})

export type ContestListQuery = z.infer<typeof ContestListQuerySchema>

export const ContestListQueryResultSchema = PaginatedSchema(z.object({
  contestId: ContestModelSchema.shape.contestId,
  title: ContestModelSchema.shape.title,
  startsAt: ContestModelSchema.shape.startsAt,
  endsAt: ContestModelSchema.shape.endsAt,
  isPublic: ContestModelSchema.shape.isPublic,
  isHidden: ContestModelSchema.shape.isHidden.optional(),
}))

export type ContestListQueryResult = z.input<typeof ContestListQueryResultSchema>

export const ContestParticipationQueryResultSchema = z.object({
  isJury: z.boolean(),
  participation: z.enum(ParticipationStatus),
  canParticipate: z.boolean(),
  canParticipateByPassword: z.boolean(),
})

export type ContestParticipationQueryResult = z.input<typeof ContestParticipationQueryResultSchema>

export const ContestParticipatePayloadSchema = z.object({
  password: z.string().optional(),
})

export type ContestParticipatePayload = z.infer<typeof ContestParticipatePayloadSchema>

export const ContestDetailQueryResultSchema = z.object({
  contestId: ContestModelSchema.shape.contestId,
  title: ContestModelSchema.shape.title,
  startsAt: ContestModelSchema.shape.startsAt,
  endsAt: ContestModelSchema.shape.endsAt,
  isPublic: ContestModelSchema.shape.isPublic,
  isHidden: ContestModelSchema.shape.isHidden,
  isJury: z.boolean(),
  problems: z.array(z.object({
    index: z.number().positive(),
    problemId: ProblemModelSchema.shape.pid,
    title: ProblemModelSchema.shape.title,
    submit: z.number().nonnegative(),
    solve: z.number().nonnegative(),
    isAttempted: z.boolean(),
    isSolved: z.boolean(),
  })),
  labelingStyle: ContestModelSchema.shape.labelingStyle,
  course: z.object({
    courseId: z.number(),
    name: z.string(),
  }).nullable(),
})

export type ContestDetailQueryResult = z.input<typeof ContestDetailQueryResultSchema>

export const ContestConfigQueryResultSchema = z.object({
  contestId: ContestModelSchema.shape.contestId,
  title: ContestModelSchema.shape.title,
  startsAt: ContestModelSchema.shape.startsAt,
  endsAt: ContestModelSchema.shape.endsAt,
  scoreboardFrozenAt: ContestModelSchema.shape.scoreboardFrozenAt,
  scoreboardUnfrozenAt: ContestModelSchema.shape.scoreboardUnfrozenAt,
  isHidden: ContestModelSchema.shape.isHidden,
  isLocked: ContestModelSchema.shape.isLocked,
  isPublic: ContestModelSchema.shape.isPublic,
  password: ContestModelSchema.shape.password,
  allowedUsers: z.array(z.object({
    username: UserModelSchema.shape.uid,
    nickname: UserModelSchema.shape.nick,
  })),
  allowedGroups: z.array(z.object({
    groupId: GroupModelSchema.shape.gid,
    name: GroupModelSchema.shape.title,
  })),
  ipWhitelist: ContestModelSchema.shape.ipWhitelist,
  ipWhitelistEnabled: ContestModelSchema.shape.ipWhitelistEnabled,
  problems: z.array(z.object({
    problemId: ProblemModelSchema.shape.pid,
    title: ProblemModelSchema.shape.title,
  })),
  labelingStyle: ContestModelSchema.shape.labelingStyle,
  course: z.object({
    courseId: z.number(),
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
  password: ContestModelSchema.shape.password,
  allowedUsers: z.array(UserModelSchema.shape.uid),
  allowedGroups: z.array(GroupModelSchema.shape.gid),
  ipWhitelist: ContestModelSchema.shape.ipWhitelist,
  ipWhitelistEnabled: ContestModelSchema.shape.ipWhitelistEnabled,
  problems: z.array(ProblemModelSchema.shape.pid),
  labelingStyle: ContestModelSchema.shape.labelingStyle,
  course: z.number().nonnegative().nullable(),
}).partial()

export type ContestConfigEditPayload = z.infer<typeof ContestConfigEditPayloadSchema>

export const ContestSolutionListQuerySchema = z.object({
  page: PaginationSchema.shape.page,
  pageSize: PaginationSchema.shape.pageSize.default(30),
  sort: SortOptionSchema.shape.sort,
  sortBy: z.enum(['createdAt', 'time', 'memory']).default('createdAt'),
  user: z.string().max(30).optional(),
  problem: stringToInt.pipe(z.int().nonnegative()).optional(),
  judge: stringToInt.pipe(z.enum(JudgeStatus)).optional(),
  language: stringToInt.pipe(z.enum(Language)).optional(),
})

export type ContestSolutionListQuery = z.infer<typeof ContestSolutionListQuerySchema>

export const ContestSolutionListQueryResultSchema = PaginatedSchema(z.object({
  sid: SolutionModelSchema.shape.sid,
  pid: SolutionModelSchema.shape.pid,
  uid: SolutionModelSchema.shape.uid,
  language: SolutionModelSchema.shape.language,
  judge: SolutionModelSchema.shape.judge,
  time: SolutionModelSchema.shape.time,
  memory: SolutionModelSchema.shape.memory,
  sim: SolutionModelSchema.shape.sim,
  sim_s_id: SolutionModelSchema.shape.sim_s_id,
  createdAt: SolutionModelSchema.shape.createdAt,
}))

export type ContestSolutionListQueryResult = z.input<typeof ContestSolutionListQueryResultSchema>

export const ContestSolutionListExportQuerySchema = z.object({
  sort: SortOptionSchema.shape.sort,
  sortBy: z.enum(['createdAt', 'time', 'memory']).default('createdAt'),
  user: z.string().max(30).optional(),
  problem: stringToInt.pipe(z.int().nonnegative()).optional(),
  judge: stringToInt.pipe(z.enum(JudgeStatus)).optional(),
  language: stringToInt.pipe(z.enum(Language)).optional(),
})

export type ContestSolutionListExportQuery = z.infer<typeof ContestSolutionListExportQuerySchema>

export const ContestSolutionListExportQueryResultSchema = z.array(z.object({
  sid: SolutionModelSchema.shape.sid,
  pid: SolutionModelSchema.shape.pid,
  uid: SolutionModelSchema.shape.uid,
  language: SolutionModelSchema.shape.language,
  judge: SolutionModelSchema.shape.judge,
  time: SolutionModelSchema.shape.time,
  memory: SolutionModelSchema.shape.memory,
  sim: SolutionModelSchema.shape.sim,
  sim_s_id: SolutionModelSchema.shape.sim_s_id,
  createdAt: SolutionModelSchema.shape.createdAt,
}))

export type ContestSolutionListExportQueryResult = z.input<typeof ContestSolutionListExportQueryResultSchema>
