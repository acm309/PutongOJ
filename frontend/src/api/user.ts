import type {
  UserItemListQueryResult,
  UserProfileQueryResult,
  UserRanklistExportQuery,
  UserRanklistExportQueryResult,
  UserRanklistQuery,
  UserRanklistQueryResult,
  UserSuggestQuery,
  UserSuggestQueryResult,
} from '@putongoj/shared'
import { instanceSafe as instance } from './instance'

export async function suggestUsers (params: UserSuggestQuery) {
  return instance.get<UserSuggestQueryResult>('/users/suggest', { params })
}
export async function getUser (uid: string) {
  return instance.get<UserProfileQueryResult>(`/users/${encodeURIComponent(uid)}`)
}
export async function getAllUserItems () {
  return instance.get<UserItemListQueryResult>('/users/items')
}

export async function findRanklist (params: UserRanklistQuery) {
  return instance.get<UserRanklistQueryResult>('/users/ranklist', { params })
}
export async function exportRanklist (params: UserRanklistExportQuery) {
  return instance.get<UserRanklistExportQueryResult>('/users/ranklist/export', { params })
}
