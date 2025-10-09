import type {
  AdminSolutionListQuery,
  AdminSolutionListQueryResult,
  AdminUserChangePasswordPayload,
  AdminUserDetailQueryResult,
  AdminUserEditPayload,
  AdminUserListQuery,
  AdminUserListQueryResult,
  AdminUserOAuthQueryResult,
  Enveloped,
} from '@putongoj/shared'
import { OAuthProvider } from '@putongoj/shared'
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

export async function getUserOAuthConnections (uid: string) {
  const { data } = await instance.get(`/admin/user/${encodeURIComponent(uid)}/oauth`)
  return data as Enveloped<AdminUserOAuthQueryResult>
}

export async function removeUserOAuthConnection (uid: string, provider: OAuthProvider) {
  const providerMap: Record<OAuthProvider, string> = {
    [OAuthProvider.CJLU]: 'cjlu',
  }
  const { data } = await instance.delete(`/admin/user/${encodeURIComponent(uid)}/oauth/${providerMap[provider]}`)
  return data as Enveloped<null>
}

export async function findSolutions (params: AdminSolutionListQuery) {
  const { data } = await instance.get('/admin/solution', { params })
  return data as Enveloped<AdminSolutionListQueryResult>
}
