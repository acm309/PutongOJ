import type { Paginated, UserModel } from '@putongoj/shared'
import type { Types } from 'mongoose'
import type { UserDocument } from '../models/User'
import type { PaginateOption, SortOption } from '../types'
import { EXPORT_SIZE_MAX, OAuthProvider, RESERVED_KEYWORDS, UserPrivilege } from '@putongoj/shared'
import { escapeRegExp } from 'lodash'
import redis from '../config/redis'
import { distributeWork } from '../jobs/helper'
import User from '../models/User'
import { getUserOAuthConnection } from './oauth'

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
  opt: PaginateOption & { group?: number },
): Promise<Paginated<UserModel>> {
  const { page, pageSize, group } = opt

  const filter: Record<string, any> = {
    solve: { $gt: 0 },
    privilege: { $ne: UserPrivilege.Banned },
  }
  if (typeof group === 'number') {
    filter.gid = group
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
  opt: { group?: number },
): Promise<Pick<UserModel, 'uid' | 'nick' | 'solve' | 'submit'>[]> {
  const { group } = opt

  const filter: Record<string, any> = {
    solve: { $gt: 0 },
    privilege: { $ne: UserPrivilege.Banned },
  }
  if (typeof group === 'number') {
    filter.gid = group
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

export async function createUser (data: Pick<UserModel, 'uid' | 'pwd'>): Promise<UserDocument> {
  const user = new User({
    uid: data.uid,
    pwd: data.pwd,
  })
  await user.save()
  return user
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
  getCodeforcesProfile,
} as const

export default userService
