import type { Types, UserDocument } from '@putong-oj/db'
import type { Paginated, UserModel, UserSubmissionHeatmap } from '@putong-oj/shared'
import type { PaginateOption, SortOption } from '../types/index.ts'
import { Solution, User } from '@putong-oj/db'
import { EXPORT_SIZE_MAX, OAuthProvider, RESERVED_KEYWORDS, UserPrivilege } from '@putong-oj/shared'
import escapeRegExp from 'lodash/escapeRegExp.js'
import { DateTime } from 'luxon'
import config from '../config/index.ts'
import redis from '../config/redis.ts'
import { CacheKey, cacheService } from './cache.ts'
import { getUserOAuthConnection } from './oauth.ts'
import { distributeWork } from './taskQueue.ts'

const reservedUsernames = new Set(
  RESERVED_KEYWORDS.flatMap(s => [ s.toLowerCase(), `${s.toLowerCase()}s` ]),
)

export async function findUsers (
  opt: PaginateOption & SortOption & {
    keyword?: string
    privilege?: UserPrivilege
  },
): Promise<Paginated<UserModel>> {
  const { page, pageSize, sort, sortBy, keyword, privilege } = opt

  const filter: Record<string, any> = {}
  if (typeof privilege === 'number') {
    filter.privilege = privilege
  }
  if (keyword) {
    filter.$or = [
      { uid: { $regex: new RegExp(escapeRegExp(keyword), 'i') } },
      { nick: { $regex: new RegExp(escapeRegExp(keyword), 'i') } },
    ]
  }

  const query = {
    sort: { [sortBy]: sort },
    page,
    limit: pageSize,
    lean: true,
    leanWithId: false,
  }

  return await User.paginate(filter, query) as any
}

export async function suggestUsers (
  keyword: string, limit: number = 10,
): Promise<Pick<UserModel, 'uid' | 'nick'>[]> {
  if (!keyword || limit <= 0) { return [] }

  const filter = {
    $or: [
      { uid: { $regex: new RegExp(escapeRegExp(keyword), 'i') } },
      { nick: { $regex: new RegExp(escapeRegExp(keyword), 'i') } },
    ],
  }
  return await User.find(filter)
    .select({ _id: 0, uid: 1, nick: 1 })
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean()
}

export async function getAllUserItems (): Promise<Pick<UserModel, 'uid' | 'nick'>[]> {
  return await User.find()
    .select({ _id: 0, uid: 1, nick: 1 })
    .sort({ createdAt: -1 })
    .lean()
}

export async function findRanklist (
  opt: PaginateOption & { group?: string },
): Promise<Paginated<UserModel>> {
  const { page, pageSize, group } = opt

  const filter: Record<string, any> = {
    solve: { $gt: 0 },
    privilege: { $ne: UserPrivilege.Banned },
  }
  if (typeof group === 'string') {
    filter.groups = group
  }

  const query = {
    sort: { solve: -1, submit: 1, createdAt: 1 },
    page,
    limit: pageSize,
    lean: true,
    leanWithId: false,
  }

  return await User.paginate(filter, query) as any
}

export async function exportRanklist (
  opt: { group?: string },
): Promise<Pick<UserModel, 'uid' | 'nick' | 'solve' | 'submit'>[]> {
  const { group } = opt

  const filter: Record<string, any> = {
    solve: { $gt: 0 },
    privilege: { $ne: UserPrivilege.Banned },
  }
  if (typeof group === 'string') {
    filter.groups = group
  }

  return await User.find(filter)
    .select({ _id: 0, uid: 1, nick: 1, solve: 1, submit: 1 })
    .sort({ solve: -1, submit: 1, createdAt: 1 })
    .limit(EXPORT_SIZE_MAX)
    .lean()
}

export async function getUser (uid: string): Promise<UserDocument | null> {
  return await User.findOne({
    uid: { $regex: new RegExp(`^${escapeRegExp(uid)}$`, 'i') },
  })
}

export async function updateUser (user: UserDocument, data: Partial<UserModel>): Promise<UserDocument> {
  if (data.privilege !== undefined) {
    user.privilege = data.privilege
  }
  if (data.nick !== undefined) {
    user.nick = data.nick
  }
  if (data.avatar !== undefined) {
    user.avatar = data.avatar
  }
  if (data.motto !== undefined) {
    user.motto = data.motto
  }
  if (data.mail !== undefined) {
    user.mail = data.mail
  }
  if (data.school !== undefined) {
    user.school = data.school
  }
  if (data.pwd !== undefined) {
    user.pwd = data.pwd
  }
  if (data.storageQuota !== undefined) {
    user.storageQuota = data.storageQuota
  }

  await user.save()
  return user
}

export async function checkUserAvailable (username: string): Promise<boolean> {
  if (reservedUsernames.has(username.toLowerCase())) {
    return false
  }

  const user = await getUser(username)
  return !user
}

export async function createUser (
  data: Pick<UserModel, 'uid' | 'pwd'> & Partial<Pick<UserModel, 'nick'>>,
): Promise<UserDocument> {
  const user = new User({
    uid: data.uid,
    pwd: data.pwd,
    nick: data.nick,
  })
  await user.save()
  return user
}

export async function getSubmissionHeatmap (user: Types.ObjectId) {
  return await cacheService.getOrCreate<UserSubmissionHeatmap>(
    CacheKey.userSubmissionHeatmap(user),

    async () => {
      const timezone = config.submissionHeatmapTimezone

      const userDoc = await User
        .findById(user)
        .select({ _id: 0, uid: 1 })
        .lean()
      if (!userDoc) {
        return { data: {}, startDate: '', endDate: '', timezone }
      }
      const { uid } = userDoc

      const nowInTz = DateTime.now().setZone(timezone)
      const weekday = nowInTz.weekday

      // Week starts on Monday,
      // make sure the first week is always full,
      // and at least 1 year of data is included
      const totalDays = 52 * 7 + weekday
      const startDateTime = nowInTz.minus({ days: totalDays - 1 })

      const startDate = startDateTime.toFormat('yyyy-MM-dd')
      const endDate = nowInTz.toFormat('yyyy-MM-dd')

      const queryStart = startDateTime.startOf('day').toUTC().toJSDate()
      const queryEnd = nowInTz.endOf('day').toUTC().toJSDate()

      const results = await Solution.aggregate<{ _id: string, count: number }>([
        { $match: { uid, createdAt: { $gte: queryStart, $lte: queryEnd } } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt', timezone } },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ])

      const data: Record<string, number> = {}
      for (const { _id: date, count } of results) {
        data[date] = count
      }
      return { data, startDate, endDate, timezone }
    },

    { redisTtl: 60 * 5 }, // 5 minutes
  )
}

export async function getCodeforcesProfile (
  user: Types.ObjectId,
): Promise<{ handle: string, rating: number } | null> {
  const cacheKey = `user:codeforces:cache:${user.toString()}`
  const cached = await redis.get(cacheKey)
  if (cached) {
    return JSON.parse(cached)
  }

  const connection = await getUserOAuthConnection(user, OAuthProvider.Codeforces)
  if (!connection) {
    return null
  }

  const handle = connection.displayName
  let rating: number = 0
  if (connection.raw && typeof connection.raw.rating === 'number') {
    rating = connection.raw.rating
  }

  const infoStr = await redis.get(`user:codeforces:info:${handle}`)
  let fetchAt: number = 0
  if (infoStr) {
    try {
      const info = JSON.parse(infoStr)
      if (typeof info.rating === 'number') {
        rating = info.rating
      }
      if (typeof info.fetchedAt === 'number') {
        fetchAt = info.fetchedAt
      }
    } catch {
      // ignore
    }
  }

  const tasks: Promise<any>[] = []
  if (Date.now() - fetchAt > 24 * 60 * 60 * 1000) {
    tasks.push(distributeWork('fetchCodeforces', `userInfo:${handle}`))
  }
  const result = { handle, rating }
  tasks.push(redis.set(cacheKey, JSON.stringify(result), 'EX', 60))

  await Promise.all(tasks)
  return result
}

const userService = {
  findUsers,
  suggestUsers,
  getAllUserItems,
  findRanklist,
  exportRanklist,
  getUser,
  updateUser,
  checkUserAvailable,
  createUser,
  getSubmissionHeatmap,
  getCodeforcesProfile,
} as const

export default userService
