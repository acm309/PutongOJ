import type {
  DiscussionDetailQueryResult,
  DiscussionListQuery,
  DiscussionListQueryResult,
} from '@putongoj/shared'
import { instanceSafe as instance } from './instance'

export async function findDiscussions (params: DiscussionListQuery) {
  return instance.get<DiscussionListQueryResult>('/discussions', { params })
}

export async function getDiscussion (discussionId: number | string) {
  return instance.get<DiscussionDetailQueryResult>(`/discussions/${encodeURIComponent(discussionId)}`)
}
