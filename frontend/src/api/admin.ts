import type {
  AdminUserChangePasswordPayload,
  AdminUserDetailQueryResult,
  AdminUserEditPayload,
  AdminUserListQuery,
  AdminUserListQueryResult,
  Enveloped,
} from '@putongoj/shared'
import { instance } from './instance'

export async function findUsers (params: AdminUserListQuery) {
  const { data } = await instance.get('/admin/user', { params })
  return data as Enveloped<AdminUserListQueryResult>
}

export async function getUser (uid: string) {
  const { data } = await instance.get(`/admin/user/${encodeURIComponent(uid)}`)
  return data as Enveloped<AdminUserDetailQueryResult>
}

export async function updateUser (uid: string, payload: AdminUserEditPayload) {
  const { data } = await instance.put(`/admin/user/${encodeURIComponent(uid)}`, payload)
  return data as Enveloped<AdminUserDetailQueryResult>
}

export async function updateUserPassword (uid: string, payload: AdminUserChangePasswordPayload) {
  const { data } = await instance.put(`/admin/user/${encodeURIComponent(uid)}/password`, payload)
  return data as Enveloped<null>
}
