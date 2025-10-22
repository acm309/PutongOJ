import type {
  AdminSolutionListExportQuery,
  AdminSolutionListExportQueryResult,
  AdminSolutionListQuery,
  AdminSolutionListQueryResult,
  AdminUserChangePasswordPayload,
  AdminUserDetailQueryResult,
  AdminUserEditPayload,
  AdminUserListQuery,
  AdminUserListQueryResult,
  AdminUserOAuthQueryResult,
} from '@putongoj/shared'
import { OAuthProvider } from '@putongoj/shared'
import { instanceSafe as instance } from './instance'

export async function findUsers (params: AdminUserListQuery) {
  return instance.get<AdminUserListQueryResult>('/admin/users', { params })
}
export async function getUser (uid: string) {
  return instance.get<AdminUserDetailQueryResult>(`/admin/users/${encodeURIComponent(uid)}`)
}
export async function updateUser (uid: string, payload: AdminUserEditPayload) {
  return instance.put<AdminUserDetailQueryResult>(`/admin/users/${encodeURIComponent(uid)}`, payload)
}
export async function updateUserPassword (uid: string, payload: AdminUserChangePasswordPayload) {
  return instance.put<null>(`/admin/users/${encodeURIComponent(uid)}/password`, payload)
}
export async function getUserOAuthConnections (uid: string) {
  return instance.get<AdminUserOAuthQueryResult>(`/admin/users/${encodeURIComponent(uid)}/oauth`)
}
export async function removeUserOAuthConnection (uid: string, provider: OAuthProvider) {
  const providerMap: Record<OAuthProvider, string> = {
    [OAuthProvider.CJLU]: 'cjlu',
  }
  return instance.delete<null>(`/admin/users/${encodeURIComponent(uid)}/oauth/${providerMap[provider]}`)
}

export async function findSolutions (params: AdminSolutionListQuery) {
  return instance.get<AdminSolutionListQueryResult>('/admin/solutions', { params })
}
export async function exportSolutions (params: AdminSolutionListExportQuery) {
  return instance.get<AdminSolutionListExportQueryResult>('/admin/solutions/export', { params })
}
