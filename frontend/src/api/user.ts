import type {
  Enveloped,
  UserProfileQueryResult,
  UserRanklistQuery,
  UserRanklistQueryResult,
} from '@putongoj/shared'
import { instance } from './instance'

export async function findRanklist (params: UserRanklistQuery) {
  const { data } = await instance.get('/user/ranklist', { params })
  return data as Enveloped<UserRanklistQueryResult>
}

export async function getUser (uid: string) {
  const { data } = await instance.get(`/user/${uid}`)
  return data as Enveloped<UserProfileQueryResult>
}
