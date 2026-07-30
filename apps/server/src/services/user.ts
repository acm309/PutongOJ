import type { Prisma } from '@putongoj/db'
import type { UserPrivilege, UserSubmissionHeatmap } from '@putongoj/shared'
import type { PaginateOption, SortOption } from '../types'
import { EXPORT_SIZE_MAX, OAuthProvider, RESERVED_KEYWORDS, UserPrivilege as UserPrivilegeEnum } from '@putongoj/shared'
import { DateTime } from 'luxon'
import { authenticatedUserSelect } from '../auth/user'
import config from '../config'
import { getDatabase } from '../config/postgres'
import redis from '../config/redis'
import { distributeWork } from '../jobs/helper'
import { CacheKey, cacheService } from './cache'
import { getUserOAuthConnection } from './oauth'

const reservedUsernames = new Set(RESERVED_KEYWORDS.flatMap(value => [ value.toLowerCase(), `${value.toLowerCase()}s` ]))

const userSortableFields = new Set([
  'username',
  'nickname',
  'createdAt',
  'updatedAt',
  'privilege',
] as const)

export async function findUsers (opt: PaginateOption & SortOption & { keyword?: string, privilege?: UserPrivilege }) {
  const database = await getDatabase()
  const where = {
    ...(opt.privilege === undefined ? {} : { privilege: opt.privilege }),
    ...(opt.keyword
      ? { OR: [
          { username: { contains: opt.keyword, mode: 'insensitive' as const } },
          { nickname: { contains: opt.keyword, mode: 'insensitive' as const } },
        ] }
      : {}),
  }
  const sortField = userSortableFields.has(opt.sortBy as typeof userSortableFields extends Set<infer Field> ? Field : never)
    ? opt.sortBy as 'username' | 'nickname' | 'createdAt' | 'updatedAt' | 'privilege'
    : 'createdAt'
  const orderBy: Prisma.UserOrderByWithRelationInput[] = [
    { [sortField]: opt.sort as Prisma.SortOrder },
    ...(sortField === 'createdAt'
      ? []
      : [ { createdAt: 'desc' as Prisma.SortOrder } ]),
  ]
  const [ users, total ] = await Promise.all([
    database.user.findMany({
      where,
      select: {
        id: true,
        username: true,
        privilege: true,
        nickname: true,
        createdAt: true,
        lastVisitedAt: true,
      },
      orderBy,
      skip: (opt.page - 1) * opt.pageSize,
      take: opt.pageSize,
    }),
    database.user.count({ where }),
  ])
  return {
    items: users,
    page: opt.page,
    pageSize: opt.pageSize,
    total,
  }
}

export async function suggestUsers (keyword: string, limit: number = 10) {
  if (!keyword || limit <= 0) { return [] }
  const database = await getDatabase()
  const users = await database.user.findMany({
    where: { OR: [ { username: { contains: keyword, mode: 'insensitive' } }, { nickname: { contains: keyword, mode: 'insensitive' } } ] },
    select: { id: true, username: true, nickname: true },
    orderBy: { createdAt: 'desc' },
    take: limit,
  })
  return users
}

export async function getAllUserItems () {
  const database = await getDatabase()
  return await database.user.findMany({ select: { id: true, username: true, nickname: true }, orderBy: { createdAt: 'desc' } })
}

export async function findRanklist (opt: PaginateOption & { groupId?: number }) {
  const database = await getDatabase()
  const where = {
    privilege: { not: UserPrivilegeEnum.BANNED },
    submissionStats: { solvedProblemCount: { gt: 0 } },
    ...(opt.groupId === undefined ? {} : { groupMemberships: { some: { groupId: opt.groupId } } }),
  }
  const ranklistOrderBy: Prisma.UserOrderByWithRelationInput[] = [
    { submissionStats: { solvedProblemCount: 'desc' } },
    { submissionStats: { submittedProblemCount: 'asc' } },
    { createdAt: 'asc' },
  ]
  const [ users, total ] = await Promise.all([
    database.user.findMany({
      where,
      include: { submissionStats: true },
      orderBy: ranklistOrderBy,
      skip: (opt.page - 1) * opt.pageSize,
      take: opt.pageSize,
    }),
    database.user.count({ where }),
  ])
  return {
    items: users.map(user => ({
      id: user.id,
      username: user.username,
      nickname: user.nickname,
      avatarUrl: user.avatarUrl,
      motto: user.motto,
      solvedProblemCount: user.submissionStats?.solvedProblemCount ?? 0,
      submittedProblemCount: user.submissionStats?.submittedProblemCount ?? 0,
    })),
    page: opt.page,
    pageSize: opt.pageSize,
    total,
  }
}

export async function exportRanklist (opt: { groupId?: number }) {
  const database = await getDatabase()
  const where = {
    privilege: { not: UserPrivilegeEnum.BANNED },
    submissionStats: { solvedProblemCount: { gt: 0 } },
    ...(opt.groupId === undefined
      ? {}
      : { groupMemberships: { some: { groupId: opt.groupId } } }),
  }
  const users = await database.user.findMany({
    where,
    include: { submissionStats: true },
    orderBy: [
      { submissionStats: { solvedProblemCount: 'desc' } },
      { submissionStats: { submittedProblemCount: 'asc' } },
      { createdAt: 'asc' },
    ],
    take: EXPORT_SIZE_MAX,
  })
  return users.map(user => ({
    id: user.id,
    username: user.username,
    nickname: user.nickname,
    solvedProblemCount: user.submissionStats?.solvedProblemCount ?? 0,
    submittedProblemCount: user.submissionStats?.submittedProblemCount ?? 0,
  }))
}

export async function getUser (username: string) {
  const database = await getDatabase()
  const user = await database.user.findFirst({
    where: { username: { equals: username, mode: 'insensitive' } },
    select: authenticatedUserSelect,
  })
  return user
}

export async function getUserById (userId: number) {
  const database = await getDatabase()
  const user = await database.user.findUnique({ where: { id: userId }, select: authenticatedUserSelect })
  return user
}

export async function updateUser (userId: number, data: Partial<{
  privilege: UserPrivilege
  nickname: string
  avatarUrl: string
  motto: string
  email: string
  school: string
  passwordHash: string
  storageQuota: number
}>) {
  const database = await getDatabase()
  const user = await database.user.update({ where: { id: userId }, data, select: authenticatedUserSelect })
  return user
}

export async function checkUserAvailable (username: string) {
  if (reservedUsernames.has(username.toLowerCase())) { return false }
  return (await getUser(username)) === null
}

export async function createUser (data: { username: string, passwordHash: string, nickname?: string }) {
  const database = await getDatabase()
  const user = await database.user.create({
    data: {
      username: data.username,
      passwordHash: data.passwordHash,
      nickname: data.nickname ?? '',
    },
    select: authenticatedUserSelect,
  })
  return user
}

export async function getSubmissionHeatmap (userId: number): Promise<UserSubmissionHeatmap> {
  return await cacheService.getOrCreate(CacheKey.userSubmissionHeatmap(userId), async () => {
    const timezone = config.submissionHeatmapTimezone
    const now = DateTime.now().setZone(timezone)
    const start = now.minus({ days: 52 * 7 + now.weekday - 1 }).startOf('day')
    const database = await getDatabase()
    const rows = await database.submission.findMany({
      where: {
        userId,
        createdAt: {
          gte: start.toUTC().toJSDate(),
          lte: now.endOf('day').toUTC().toJSDate(),
        },
      },
      select: { createdAt: true },
    })
    const data: Record<string, number> = {}
    for (const row of rows) {
      const date = DateTime.fromJSDate(row.createdAt).setZone(timezone).toFormat('yyyy-MM-dd')
      data[date] = (data[date] ?? 0) + 1
    }
    return { data, startDate: start.toFormat('yyyy-MM-dd'), endDate: now.toFormat('yyyy-MM-dd'), timezone }
  }, { redisTtl: 300 })
}

export async function getCodeforcesProfile (userId: number): Promise<{ handle: string, rating: number } | null> {
  const connection = await getUserOAuthConnection(userId, OAuthProvider.Codeforces)
  if (!connection) { return null }
  const handle = connection.displayName
  const rawProfile = typeof connection.raw === 'object'
    && connection.raw !== null
    && !Array.isArray(connection.raw)
    ? connection.raw as { rating?: unknown }
    : null
  let rating = typeof rawProfile?.rating === 'number' ? rawProfile.rating : 0
  const cached = await redis.get(`user:codeforces:info:${handle}`)
  let fetchedAt = 0
  if (cached) {
    try {
      const info = JSON.parse(cached)
      rating = typeof info.rating === 'number' ? info.rating : rating
      fetchedAt = typeof info.fetchedAt === 'number' ? info.fetchedAt : 0
    } catch {}
  }
  if (Date.now() - fetchedAt > 24 * 60 * 60 * 1000) { await distributeWork('fetchCodeforces', `userInfo:${handle}`) }
  return { handle, rating }
}

const userService = {
  findUsers,
  suggestUsers,
  getAllUserItems,
  findRanklist,
  exportRanklist,
  getUser,
  getUserById,
  updateUser,
  checkUserAvailable,
  createUser,
  getSubmissionHeatmap,
  getCodeforcesProfile,
} as const
export default userService
