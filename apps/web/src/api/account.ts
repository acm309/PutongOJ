import type {
  AccountChangePasswordPayload,
  AccountEditPayload,
  AccountLoginPayload,
  AccountProfileQueryResult,
  AccountRegisterPayload,
  AccountSubmissionListQuery,
  AccountSubmissionListQueryResult,
  SessionListQueryResult,
  SessionRevokeOthersResult,
} from '@putong-oj/shared'
import { ErrorCode } from '@putong-oj/shared'
import { apiClient } from './instance'

export async function userLogin (payload: AccountLoginPayload) {
  return apiClient.post<AccountProfileQueryResult>(
    '/account/login',
    payload,
    { callerHandledCodes: 'all' },
  )
}
export async function userRegister (payload: AccountRegisterPayload) {
  return apiClient.post<AccountProfileQueryResult>(
    '/account/register',
    payload,
    { callerHandledCodes: 'all' },
  )
}
export async function userLogout () {
  return apiClient.post<null>('/account/logout')
}

export async function getProfile () {
  return apiClient.get<AccountProfileQueryResult>(
    '/account/profile',
    { callerHandledCodes: [ ErrorCode.Unauthorized ] },
  )
}
export async function updateProfile (payload: AccountEditPayload) {
  return apiClient.put<AccountProfileQueryResult>('/account/profile', payload)
}
export async function updatePassword (payload: AccountChangePasswordPayload) {
  return apiClient.put<null>(
    '/account/password',
    payload,
    { callerHandledCodes: [ ErrorCode.Unauthorized ] },
  )
}

export async function findSubmissions (params: AccountSubmissionListQuery) {
  return apiClient.get<AccountSubmissionListQueryResult>('/account/submissions', { params })
}

export async function listSessions () {
  return apiClient.get<SessionListQueryResult>('/account/sessions')
}
export async function revokeSession (sessionId: string) {
  return apiClient.delete<null>(`/account/sessions/${encodeURIComponent(sessionId)}`)
}
export async function revokeOtherSessions () {
  return apiClient.delete<SessionRevokeOthersResult>('/account/sessions')
}
