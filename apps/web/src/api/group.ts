import type { GroupListQueryResult } from '@putong-oj/shared'
import { instanceSafe as instance } from './instance'

export async function findGroups () {
  return instance.get<GroupListQueryResult>('/group')
}
