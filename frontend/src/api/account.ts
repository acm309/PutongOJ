import type {
  AccountChangePasswordPayload,
  AccountEditPayload,
  AccountLoginPayload,
  AccountProfileQueryResult,
  AccountRegisterPayload,
  AccountSubmissionListQuery,
  AccountSubmissionListQueryResult,
  Enveloped,
} from '@putongoj/shared'
import { instance } from './instance'

export async function getProfile () {
  const { data } = await instance.get('/account/profile')
  return data as Enveloped<AccountProfileQueryResult>
}

export async function userLogin (payload: AccountLoginPayload) {
  const { data } = await instance.post('/account/login', payload)
  return data as Enveloped<AccountProfileQueryResult>
}

export async function userRegister (payload: AccountRegisterPayload) {
  const { data } = await instance.post('/account/register', payload)
  return data as Enveloped<AccountProfileQueryResult>
}

export async function userLogout () {
  const { data } = await instance.post('/account/logout')
  return data as Enveloped<null>
}

export async function updateProfile (payload: AccountEditPayload) {
  const { data } = await instance.put('/account/profile', payload)
  return data as Enveloped<AccountProfileQueryResult>
}

export async function updatePassword (payload: AccountChangePasswordPayload) {
  const { data } = await instance.put('/account/password', payload)
  return data as Enveloped<null>
}

export async function findSubmissions (params: AccountSubmissionListQuery) {
  const { data } = await instance.get('/account/submissions', { params })
  return data as Enveloped<AccountSubmissionListQueryResult>
}
