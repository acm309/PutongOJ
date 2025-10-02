import type {
  AdminUserListQuery,
  AdminUserListQueryResult,
  Enveloped,
} from '@putongoj/shared'
import { instance } from './instance'

export async function findUsers (params: AdminUserListQuery) {
  const { data } = await instance.get('/admin/user', { params })
  return data as Enveloped<AdminUserListQueryResult>
}
