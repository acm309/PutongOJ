import type { Paginated, PaginateOption, SortOption, UserModel, UserPrivilege } from '../types'
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

const userServices = {
  findUsers,
} as const

export default userServices
