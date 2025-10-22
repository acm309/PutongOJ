import type { GroupListQueryResult } from '@putongoj/shared'
import { instanceSafe as instance } from './instance'

export async function findGroups () {
  return instance.get<GroupListQueryResult>('/group')
}
