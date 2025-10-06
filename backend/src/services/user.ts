import type { Paginated, UserModel, UserPrivilege } from '@putongoj/shared'
import type { UserDocument } from '../models/User'
import type { PaginateOption, SortOption } from '../types'
import { escapeRegExp } from 'lodash'
import User from '../models/User'

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

export async function createUser (data: Pick<UserModel, 'uid' | 'pwd'>): Promise<UserDocument> {
  const user = new User({
    uid: data.uid,
    pwd: data.pwd,
  })
  await user.save()
  return user
}

const userServices = {
  findUsers,
  getUser,
  updateUser,
  createUser,
} as const

export default userServices
