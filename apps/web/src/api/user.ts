import type {
  UserItemListQueryResult,
  UserProfileQueryResult,
  UserRanklistQuery,
  UserRanklistQueryResult,
  UserSuggestQuery,
  UserSuggestQueryResult,
} from '@putong-oj/shared'
import { apiClient } from './instance'

export async function suggestUsers (params: UserSuggestQuery) {
  return apiClient.get<UserSuggestQueryResult>('/users/suggest', { params })
}
export async function getUser (uid: string) {
  return apiClient.get<UserProfileQueryResult>(`/users/${encodeURIComponent(uid)}`)
}
export async function getAllUserItems () {
  return apiClient.get<UserItemListQueryResult>('/users/items')
}

export async function findRanklist (params: UserRanklistQuery) {
  return apiClient.get<UserRanklistQueryResult>('/users/ranklist', { params })
}
