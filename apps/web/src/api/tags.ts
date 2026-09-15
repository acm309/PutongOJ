import type { TagListQueryResult } from '@putong-oj/shared'
import { instanceSafe as instance } from './instance'

export async function findTags () {
  return instance.get<TagListQueryResult>('/tags')
}
