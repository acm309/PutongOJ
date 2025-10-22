import type {
  AccountChangePasswordPayload,
  AccountEditPayload,
  AccountLoginPayload,
  AccountProfileQueryResult,
  AccountRegisterPayload,
  AccountSubmissionListQuery,
  AccountSubmissionListQueryResult,
} from '@putongoj/shared'
import { instanceSafe as instance } from './instance'

export async function userLogin (payload: AccountLoginPayload) {
  return instance.post<AccountProfileQueryResult>('/account/login', payload)
}
export async function userRegister (payload: AccountRegisterPayload) {
  return instance.post<AccountProfileQueryResult>('/account/register', payload)
}
export async function userLogout () {
  return instance.post<null>('/account/logout')
}

export async function getProfile () {
  return instance.get<AccountProfileQueryResult>('/account/profile')
}
export async function updateProfile (payload: AccountEditPayload) {
  return instance.put<AccountProfileQueryResult>('/account/profile', payload)
}
export async function updatePassword (payload: AccountChangePasswordPayload) {
  return instance.put<null>('/account/password', payload)
}

export async function findSubmissions (params: AccountSubmissionListQuery) {
  return instance.get<AccountSubmissionListQueryResult>('/account/submissions', { params })
}
