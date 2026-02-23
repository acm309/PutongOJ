import type {
  AdminCommentUpdatePayload,
  AdminDiscussionUpdatePayload,
  AdminGroupCreatePayload,
  AdminGroupDetailQueryResult,
  AdminGroupMembersUpdatePayload,
  AdminGroupUpdatePayload,
  AdminNotificationCreatePayload,
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
  SessionListQueryResult,
  SessionRevokeOthersResult,
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
    [OAuthProvider.Codeforces]: 'codeforces',
  }
  return instance.delete<null>(`/admin/users/${encodeURIComponent(uid)}/oauth/${providerMap[provider]}`)
}

export async function findSolutions (params: AdminSolutionListQuery) {
  return instance.get<AdminSolutionListQueryResult>('/admin/solutions', { params })
}
export async function exportSolutions (params: AdminSolutionListExportQuery) {
  return instance.get<AdminSolutionListExportQueryResult>('/admin/solutions/export', { params })
}

export async function sendNotificationBroadcast (payload: AdminNotificationCreatePayload) {
  return instance.post<null>('/admin/notifications/broadcast', payload)
}
export async function sendNotificationUser (username: string, payload: AdminNotificationCreatePayload) {
  return instance.post<null>(`/admin/notifications/users/${encodeURIComponent(username)}`, payload)
}

export async function createGroup (payload: AdminGroupCreatePayload) {
  return instance.post<AdminGroupDetailQueryResult>('/admin/groups', payload)
}
export async function getGroup (groupId: string) {
  return instance.get<AdminGroupDetailQueryResult>(`/admin/groups/${encodeURIComponent(groupId)}`)
}
export async function updateGroup (groupId: string, payload: AdminGroupUpdatePayload) {
  return instance.put<null>(`/admin/groups/${encodeURIComponent(groupId)}`, payload)
}
export async function updateGroupMembers (groupId: string, payload: AdminGroupMembersUpdatePayload) {
  return instance.put<{ modifiedCount: number }>(`/admin/groups/${encodeURIComponent(groupId)}/members`, payload)
}
export async function removeGroup (groupId: string) {
  return instance.delete<null>(`/admin/groups/${encodeURIComponent(groupId)}`)
}

export async function updateDiscussion (discussionId: number, payload: AdminDiscussionUpdatePayload) {
  return instance.put<null>(`/admin/discussions/${discussionId}`, payload)
}
export async function updateComment (commentId: number, payload: AdminCommentUpdatePayload) {
  return instance.put<null>(`/admin/comments/${commentId}`, payload)
}

export async function listUserSessions (uid: string) {
  return instance.get<SessionListQueryResult>(`/admin/users/${encodeURIComponent(uid)}/sessions`)
}
export async function revokeUserSession (uid: string, sessionId: string) {
  return instance.delete<null>(`/admin/users/${encodeURIComponent(uid)}/sessions/${encodeURIComponent(sessionId)}`)
}
export async function revokeUserAllSessions (uid: string) {
  return instance.delete<SessionRevokeOthersResult>(`/admin/users/${encodeURIComponent(uid)}/sessions`)
}
