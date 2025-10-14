import type { Paginated, UserModel } from '@putongoj/shared'
import type { UserDocument } from '../models/User'
import type { PaginateOption, SortOption } from '../types'
import { RESERVED_KEYWORDS, UserPrivilege } from '@putongoj/shared'
import { escapeRegExp } from 'lodash'
import User from '../models/User'

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

const userService = {
  findUsers,
  suggestUsers,
  getAllUserItems,
  findRanklist,
  getUser,
  updateUser,
  checkUserAvailable,
  createUser,
} as const

export default userService
