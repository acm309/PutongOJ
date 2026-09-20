import type { GroupListQueryResult } from '@putong-oj/shared'
import { apiClient } from './instance'

export async function findGroups () {
  return apiClient.get<GroupListQueryResult>('/group')
}
