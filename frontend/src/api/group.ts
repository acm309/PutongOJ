import type {
  Enveloped,
  GroupListQueryResult,
} from '@putongoj/shared'
import { instance } from './instance'

export async function findGroups () {
  const { data } = await instance.get('/group')
  return data as Enveloped<GroupListQueryResult>
}
