import type {
  AdminCommentUpdatePayload,
  AdminContestListQuery,
  AdminContestListQueryResult,
  AdminDiscussionUpdatePayload,
  AdminFileListQuery,
  AdminFileListQueryResult,
  AdminGroupCreatePayload,
  AdminGroupDetailQueryResult,
  AdminGroupMembersUpdatePayload,
  AdminGroupUpdatePayload,
  AdminNotificationCreatePayload,
  AdminPostCreatePayload,
  AdminPostDetailQueryResult,
  AdminPostListQuery,
  AdminPostListQueryResult,
  AdminPostUpdatePayload,
  AdminSolutionListExportQuery,
  AdminSolutionListExportQueryResult,
  AdminSolutionListQuery,
  AdminSolutionListQueryResult,
  AdminTagCreatePayload,
  AdminTagListQueryResult,
  AdminTagUpdatePayload,
  AdminUserBatchRegisterPayload,
  AdminUserBatchRegisterResult,
  AdminUserChangePasswordPayload,
  AdminUserDetailQueryResult,
  AdminUserEditPayload,
  AdminUserListQuery,
  AdminUserListQueryResult,
  AdminUserOAuthQueryResult,
  OAuthProvider,
  SessionListQueryResult,
  SessionRevokeOthersResult,
} from '@putong-oj/shared'
import { apiClient } from './instance'

export async function findUsers (params: AdminUserListQuery) {
  return apiClient.get<AdminUserListQueryResult>('/admin/users', { params })
}
export async function getUser (uid: string) {
  return apiClient.get<AdminUserDetailQueryResult>(`/admin/users/${encodeURIComponent(uid)}`)
}
export async function updateUser (uid: string, payload: AdminUserEditPayload) {
  return apiClient.put<AdminUserDetailQueryResult>(`/admin/users/${encodeURIComponent(uid)}`, payload)
}
export async function updateUserPassword (uid: string, payload: AdminUserChangePasswordPayload) {
  return apiClient.put<null>(`/admin/users/${encodeURIComponent(uid)}/password`, payload)
}
export async function getUserOAuthConnections (uid: string) {
  return apiClient.get<AdminUserOAuthQueryResult>(`/admin/users/${encodeURIComponent(uid)}/oauth`)
}
export async function removeUserOAuthConnection (uid: string, provider: OAuthProvider) {
  return apiClient.delete<null>(`/admin/users/${encodeURIComponent(uid)}/oauth/${provider}`)
}

export async function findSolutions (params: AdminSolutionListQuery) {
  return apiClient.get<AdminSolutionListQueryResult>('/admin/solutions', { params })
}
export async function exportSolutions (params: AdminSolutionListExportQuery) {
  return apiClient.get<AdminSolutionListExportQueryResult>('/admin/solutions/export', { params })
}

export async function findContests (params: AdminContestListQuery) {
  return apiClient.get<AdminContestListQueryResult>('/admin/contests', { params })
}

export async function findPosts (params: AdminPostListQuery) {
  return apiClient.get<AdminPostListQueryResult>('/admin/posts', { params })
}
export async function createPost (payload: AdminPostCreatePayload) {
  return apiClient.post<{ slug: string }>('/admin/posts', payload)
}
export async function getPost (slug: string) {
  return apiClient.get<AdminPostDetailQueryResult>(`/admin/posts/${encodeURIComponent(slug)}`)
}
export async function updatePost (slug: string, payload: AdminPostUpdatePayload) {
  return apiClient.put<{ slug: string }>(`/admin/posts/${encodeURIComponent(slug)}`, payload)
}
export async function deletePost (slug: string) {
  return apiClient.delete<null>(`/admin/posts/${encodeURIComponent(slug)}`)
}

export async function sendNotificationBroadcast (payload: AdminNotificationCreatePayload) {
  return apiClient.post<null>('/admin/notifications/broadcast', payload)
}
export async function sendNotificationUser (username: string, payload: AdminNotificationCreatePayload) {
  return apiClient.post<null>(`/admin/notifications/users/${encodeURIComponent(username)}`, payload)
}

export async function createGroup (payload: AdminGroupCreatePayload) {
  return apiClient.post<AdminGroupDetailQueryResult>('/admin/groups', payload)
}
export async function getGroup (groupId: string) {
  return apiClient.get<AdminGroupDetailQueryResult>(`/admin/groups/${encodeURIComponent(groupId)}`)
}
export async function updateGroup (groupId: string, payload: AdminGroupUpdatePayload) {
  return apiClient.put<null>(`/admin/groups/${encodeURIComponent(groupId)}`, payload)
}
export async function updateGroupMembers (groupId: string, payload: AdminGroupMembersUpdatePayload) {
  return apiClient.put<{ modifiedCount: number }>(`/admin/groups/${encodeURIComponent(groupId)}/members`, payload)
}
export async function removeGroup (groupId: string) {
  return apiClient.delete<null>(`/admin/groups/${encodeURIComponent(groupId)}`)
}

export async function updateDiscussion (discussionId: number, payload: AdminDiscussionUpdatePayload) {
  return apiClient.put<null>(`/admin/discussions/${discussionId}`, payload)
}
export async function updateComment (commentId: number, payload: AdminCommentUpdatePayload) {
  return apiClient.put<null>(`/admin/comments/${commentId}`, payload)
}

export async function listUserSessions (uid: string) {
  return apiClient.get<SessionListQueryResult>(`/admin/users/${encodeURIComponent(uid)}/sessions`)
}
export async function revokeUserSession (uid: string, sessionId: string) {
  return apiClient.delete<null>(`/admin/users/${encodeURIComponent(uid)}/sessions/${encodeURIComponent(sessionId)}`)
}
export async function revokeUserAllSessions (uid: string) {
  return apiClient.delete<SessionRevokeOthersResult>(`/admin/users/${encodeURIComponent(uid)}/sessions`)
}

export async function findTags () {
  return apiClient.get<AdminTagListQueryResult>('/admin/tags')
}
export async function createTag (payload: AdminTagCreatePayload) {
  return apiClient.post<null>('/admin/tags', payload)
}
export async function updateTag (tagId: string, payload: AdminTagUpdatePayload) {
  return apiClient.put<null>(`/admin/tags/${encodeURIComponent(tagId)}`, payload)
}

export async function findFiles (params: AdminFileListQuery) {
  return apiClient.get<AdminFileListQueryResult>('/admin/files', { params })
}
export async function removeFile (storageKey: string) {
  return apiClient.delete<null>(`/admin/files/${encodeURIComponent(storageKey)}`)
}
export async function batchRegisterUsers (payload: AdminUserBatchRegisterPayload) {
  return apiClient.post<AdminUserBatchRegisterResult>(
    '/admin/users/batch-register',
    payload,
    { callerHandledCodes: 'all' },
  )
}
