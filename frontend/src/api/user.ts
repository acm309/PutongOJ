import type {
  Enveloped,
  UserItemListQueryResult,
  UserProfileQueryResult,
  UserRanklistQuery,
  UserRanklistQueryResult,
  UserSuggestQuery,
  UserSuggestQueryResult,
} from '@putongoj/shared'
import { instance } from './instance'

export async function suggestUsers (params: UserSuggestQuery) {
  const { data } = await instance.get('/user/suggest', { params })
  return data as Enveloped<UserSuggestQueryResult>
}

export async function findRanklist (params: UserRanklistQuery) {
  const { data } = await instance.get('/user/ranklist', { params })
  return data as Enveloped<UserRanklistQueryResult>
}

export async function getUser (uid: string) {
  const { data } = await instance.get(`/user/${uid}`)
  return data as Enveloped<UserProfileQueryResult>
}

export async function getAllUserItems () {
  const { data } = await instance.get('/user/items')
  return data as Enveloped<UserItemListQueryResult>
}
