import type { TagListQueryResult } from '@putongoj/shared'
import { instanceSafe as instance } from './instance'

export async function findTags () {
  return instance.get<TagListQueryResult>('/tags')
}
