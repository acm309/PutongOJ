import type {
  AdminUsersQuery,
  AdminUsersQueryResult,
  Enveloped,
} from '@putongoj/shared'
import { instance } from './instance'

export async function findUsers (params: AdminUsersQuery) {
  const { data } = await instance.get('/admin/user', { params })
  return data as Enveloped<AdminUsersQueryResult>
}
