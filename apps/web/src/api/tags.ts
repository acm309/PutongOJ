import type { TagListQueryResult } from '@putong-oj/shared'
import { apiClient } from './instance'

export async function findTags () {
  return apiClient.get<TagListQueryResult>('/tags')
}
