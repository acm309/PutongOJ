import type {
  Enveloped,
  UserProfileQueryResult,
} from '@putongoj/shared'
import { instance } from './instance'

export async function getUser (uid: string) {
  const { data } = await instance.get(`/user/${uid}`)
  return data as Enveloped<UserProfileQueryResult>
}
