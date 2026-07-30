import type { LabelingStyle, Language, ParticipationStatus, Prisma } from '@putongoj/db'
import type { ContestRanklist, ContestRanklistProblem, PaginatedResult } from '@putongoj/shared'
import type { PaginateOption, SortOption } from '../types'
import { JudgeStatus, ParticipationStatus as ParticipationStatusEnum } from '@putongoj/shared'
import { getDatabase } from '../config/postgres'
import logger from '../utils/logger'
import { CacheKey, cacheService } from './cache'

type ManageableParticipationStatus = Exclude<
  ParticipationStatus,
  | typeof ParticipationStatusEnum.NOT_APPLIED
  | typeof ParticipationStatusEnum.PENDING
  | typeof ParticipationStatusEnum.REJECTED
>

export interface ContestView {
  id: number
  title: string
  startsAt: Date
  endsAt: Date
  isPublic: boolean
  isHidden: boolean
  courseId: number | null
  createdAt: Date
  updatedAt: Date
}

export interface ContestWithCourse {
  id: number
  title: string
  startsAt: Date
  endsAt: Date
  scoreboardFrozenAt: Date | null
  scoreboardUnfrozenAt: Date | null
  isHidden: boolean
  isLocked: boolean
  isPublic: boolean
  password: string
  ipWhitelistEnabled: boolean
  allowEarlyExit: boolean
  allowedLanguages: Language[]
  labelingStyle: LabelingStyle
  courseId: number | null
  course: { id: number, name: string } | null
  ipWhitelist: Array<{ cidr: string, comment: string | null }>
  problems: Array<{ problemId: number, position: number, problem: { id: number, title: string } }>
  createdAt: Date
  updatedAt: Date
}

function buildOrderBy (sortBy: string, sort: 'asc' | 'desc'): Prisma.ContestOrderByWithRelationInput[] {
  const supported = new Set([ 'id', 'title', 'startsAt', 'endsAt', 'createdAt', 'updatedAt' ])
  const field = supported.has(sortBy) ? sortBy : 'createdAt'
  return [
    { [field]: sort } as Prisma.ContestOrderByWithRelationInput,
    ...(field === 'createdAt' ? [] : [ { createdAt: 'desc' } as Prisma.ContestOrderByWithRelationInput ]),
  ]
}

export async function findContests (
  options: PaginateOption & SortOption,
  filters: { title?: string, courseId?: number },
  showHidden = false,
): Promise<PaginatedResult<ContestView>> {
  const database = await getDatabase()
  const where: Prisma.ContestWhereInput = {
    ...(showHidden ? {} : { isHidden: false }),
    ...(filters.title ? { title: { contains: filters.title, mode: 'insensitive' } } : {}),
    ...(filters.courseId === undefined
      ? (showHidden ? {} : { courseId: null })
      : { courseId: filters.courseId }),
  }
  const [ items, total ] = await Promise.all([
    database.contest.findMany({
      where,
      orderBy: buildOrderBy(options.sortBy, options.sort),
      skip: (options.page - 1) * options.pageSize,
      take: options.pageSize,
    }),
    database.contest.count({ where }),
  ])
  return { items, page: options.page, pageSize: options.pageSize, total }
}

export async function getContest (contestId: number): Promise<ContestWithCourse | null> {
  const database = await getDatabase()
  return await database.contest.findUnique({
    where: { id: contestId },
    include: {
      course: { select: { id: true, name: true } },
      ipWhitelist: { orderBy: { cidr: 'asc' } },
      problems: {
        include: { problem: { select: { id: true, title: true } } },
        orderBy: { position: 'asc' },
      },
    },
  })
}

export async function createContest (data: {
  title: string
  startsAt: Date
  endsAt: Date
  isHidden?: boolean
  isPublic?: boolean
  courseId?: number | null
}) {
  const database = await getDatabase()
  return await database.contest.create({ data })
}

export async function updateContest (
  contestId: number,
  update: Partial<{
    title: string
    startsAt: Date
    endsAt: Date
    scoreboardFrozenAt: Date | null
    scoreboardUnfrozenAt: Date | null
    isHidden: boolean
    isLocked: boolean
    isPublic: boolean
    password: string | null
    ipWhitelistEnabled: boolean
    allowEarlyExit: boolean
    allowedLanguages: Language[]
    labelingStyle: LabelingStyle
    courseId: number | null
    allowedUserIds: number[]
    allowedGroupIds: number[]
    ipWhitelist: Array<{ cidr: string, comment: string | null }>
    problemIds: number[]
  }>,
): Promise<boolean> {
  const database = await getDatabase()
  try {
    await database.$transaction(async (transaction) => {
      const { allowedUserIds, allowedGroupIds, ipWhitelist, problemIds, password, ...contestData } = update
      await transaction.contest.update({
        where: { id: contestId },
        data: {
          ...contestData,
          ...(password === undefined ? {} : { password: password ?? '' }),
        },
      })

      if (allowedUserIds !== undefined) {
        await transaction.contestAllowedUser.deleteMany({ where: { contestId } })
        if (allowedUserIds.length > 0) {
          await transaction.contestAllowedUser.createMany({
            data: [ ...new Set(allowedUserIds) ].map(userId => ({ contestId, userId })),
          })
        }
      }
      if (allowedGroupIds !== undefined) {
        await transaction.contestAllowedGroup.deleteMany({ where: { contestId } })
        if (allowedGroupIds.length > 0) {
          await transaction.contestAllowedGroup.createMany({
            data: [ ...new Set(allowedGroupIds) ].map(groupId => ({ contestId, groupId })),
          })
        }
      }
      if (ipWhitelist !== undefined) {
        await transaction.contestIpWhitelist.deleteMany({ where: { contestId } })
        if (ipWhitelist.length > 0) {
          await transaction.contestIpWhitelist.createMany({
            data: ipWhitelist.map(entry => ({ contestId, ...entry })),
            skipDuplicates: true,
          })
        }
      }
      if (problemIds !== undefined) {
        const uniqueProblemIds = [ ...new Set(problemIds) ]
        if (uniqueProblemIds.length !== problemIds.length) {
          throw new Error('A contest cannot contain duplicate problems')
        }
        const validCount = await transaction.problem.count({ where: { id: { in: uniqueProblemIds } } })
        if (validCount !== uniqueProblemIds.length) {
          throw new Error('Contest references a missing problem')
        }
        await transaction.contestProblem.deleteMany({ where: { contestId } })
        if (uniqueProblemIds.length > 0) {
          await transaction.contestProblem.createMany({
            data: uniqueProblemIds.map((problemId, index) => ({
              contestId,
              problemId,
              position: index + 1,
            })),
          })
        }
      }
    })
    return true
  } catch (error) {
    logger.warn(`Failed to update contest <Contest:${contestId}>: ${String(error)}`)
    return false
  }
}

export async function getParticipation (userId: number, contestId: number): Promise<ParticipationStatus> {
  const database = await getDatabase()
  const participation = await database.contestParticipation.findUnique({
    where: { contestId_userId: { contestId, userId } },
    select: { status: true },
  })
  return participation?.status ?? ParticipationStatusEnum.NOT_APPLIED
}

export async function updateParticipation (
  userId: number,
  contestId: number,
  status: ParticipationStatus,
): Promise<void> {
  const database = await getDatabase()
  if (status === ParticipationStatusEnum.NOT_APPLIED) {
    await database.contestParticipation.deleteMany({ where: { contestId, userId } })
    return
  }
  await database.contestParticipation.upsert({
    where: { contestId_userId: { contestId, userId } },
    create: { contestId, userId, status },
    update: { status },
  })
}

export async function findParticipants (
  contestId: number,
  options: PaginateOption & SortOption,
  filters: { username?: string, status?: ManageableParticipationStatus },
) {
  const database = await getDatabase()
  const where: Prisma.ContestParticipationWhereInput = {
    contestId,
    ...(filters.status === undefined ? {} : { status: filters.status }),
    ...(filters.username
      ? {
          user: {
            OR: [
              { username: { contains: filters.username, mode: 'insensitive' } },
              { nickname: { contains: filters.username, mode: 'insensitive' } },
            ],
          },
        }
      : {}),
  }
  const orderField = new Set([ 'createdAt', 'updatedAt', 'status' ]).has(options.sortBy)
    ? options.sortBy
    : 'updatedAt'
  const [ rows, total ] = await Promise.all([
    database.contestParticipation.findMany({
      where,
      include: { user: { select: { id: true, username: true, nickname: true } } },
      orderBy: [
        { [orderField]: options.sort } as Prisma.ContestParticipationOrderByWithRelationInput,
        ...(orderField === 'updatedAt' ? [] : [ { updatedAt: 'desc' } as Prisma.ContestParticipationOrderByWithRelationInput ]),
      ],
      skip: (options.page - 1) * options.pageSize,
      take: options.pageSize,
    }),
    database.contestParticipation.count({ where }),
  ])
  return {
    items: rows.map(row => ({
      userId: row.user.id,
      username: row.user.username,
      nickname: row.user.nickname,
      status: row.status,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    })),
    page: options.page,
    pageSize: options.pageSize,
    total,
  }
}

export async function updateParticipantStatus (
  userId: number,
  contestId: number,
  status: ManageableParticipationStatus,
) {
  const database = await getDatabase()
  const result = await database.contestParticipation.updateMany({
    where: { contestId, userId },
    data: { status },
  })
  return result.count > 0
}

export type ContestProblemsWithStats = Array<{
  position: number
  problemId: number
  title: string
  submitterCount: number
  solverCount: number
}>

const ignoredJudgeStatuses = new Set<JudgeStatus>([
  JudgeStatus.COMPILE_ERROR,
  JudgeStatus.SYSTEM_ERROR,
  JudgeStatus.SKIPPED,
])

export async function getProblemsWithStats (
  contestId: number,
  isJury: boolean,
): Promise<ContestProblemsWithStats> {
  return await cacheService.getOrCreate(CacheKey.contestProblems(contestId, isJury), async () => {
    const database = await getDatabase()
    const contest = await database.contest.findUnique({
      where: { id: contestId },
      include: { problems: { include: { problem: true }, orderBy: { position: 'asc' } } },
    })
    if (!contest) {
      return []
    }
    const before = contest.scoreboardFrozenAt && !isJury
      ? contest.scoreboardFrozenAt
      : contest.endsAt
    return await Promise.all(contest.problems.map(async ({ position, problem }) => {
      const submissions = await database.submission.findMany({
        where: { contestId, problemId: problem.id, createdAt: { lt: before } },
        select: { userId: true, status: true },
      })
      const submitters = new Set(submissions
        .filter(item => !ignoredJudgeStatuses.has(item.status))
        .map(item => item.userId))
      const solvers = new Set(submissions
        .filter(item => item.status === JudgeStatus.ACCEPTED)
        .map(item => item.userId))
      return {
        position,
        problemId: problem.id,
        title: problem.title,
        submitterCount: submitters.size,
        solverCount: solvers.size,
      }
    }))
  }, { redisTtl: 10 })
}

const pendingJudgeStatuses = new Set<JudgeStatus>([
  JudgeStatus.PENDING,
  JudgeStatus.REJUDGE_PENDING,
  JudgeStatus.RUNNING_JUDGE,
])

export async function getRanklist (contestId: number, isJury: boolean): Promise<ContestRanklist> {
  return await cacheService.getOrCreate(CacheKey.contestRanklist(contestId, isJury), async () => {
    const database = await getDatabase()
    const contest = await database.contest.findUnique({
      where: { id: contestId },
      select: { endsAt: true, scoreboardFrozenAt: true, scoreboardUnfrozenAt: true },
    })
    if (!contest) {
      return []
    }
    const submissions = await database.submission.findMany({
      where: { contestId, createdAt: { lt: contest.endsAt } },
      include: { user: { select: { username: true, nickname: true } } },
      orderBy: { createdAt: 'asc' },
    })
    const isFrozen = contest.scoreboardFrozenAt !== null && !isJury
      && (contest.scoreboardUnfrozenAt === null || contest.scoreboardUnfrozenAt > new Date())
    const record: Record<string, { nickname: string, problems: Record<number, ContestRanklistProblem> }> = {}
    for (const submission of submissions) {
      if (ignoredJudgeStatuses.has(submission.status)) {
        continue
      }
      const username = submission.user.username
      const userRecord = record[username] ??= {
        nickname: submission.user.nickname,
        problems: {},
      }
      const item = userRecord.problems[submission.problemId] ??= {
        problemId: submission.problemId,
        failedCount: 0,
        pendingCount: 0,
      }
      if (item.solvedAt) {
        continue
      }
      if (isFrozen && contest.scoreboardFrozenAt && submission.createdAt >= contest.scoreboardFrozenAt) {
        item.pendingCount += 1
      } else if (pendingJudgeStatuses.has(submission.status)) {
        item.pendingCount += 1
      } else if (submission.status === JudgeStatus.ACCEPTED) {
        item.solvedAt = submission.createdAt.toISOString()
      } else {
        item.failedCount += 1
      }
    }
    return Object.entries(record).map(([ username, value ]) => ({
      username,
      nickname: value.nickname || username,
      problems: Object.values(value.problems),
    }))
  }, { redisTtl: 9 })
}

export const contestService = {
  findContests,
  getContest,
  createContest,
  updateContest,
  getParticipation,
  updateParticipation,
  findParticipants,
  updateParticipantStatus,
  getProblemsWithStats,
  getRanklist,
} as const
