import type {
  CommentCreatePayload,
  DiscussionCreatePayload,
  DiscussionCreateResult,
  DiscussionDetailQueryResult,
  DiscussionListQuery,
  DiscussionListQueryResult,
} from '@putongoj/shared'
import { instanceSafe as instance } from './instance'

export async function findDiscussions (params: DiscussionListQuery) {
  return instance.get<DiscussionListQueryResult>('/discussions', { params })
}

export async function createDiscussion (payload: DiscussionCreatePayload) {
  return instance.post<DiscussionCreateResult>('/discussions', payload)
}
export async function getDiscussion (discussionId: number | string) {
  return instance.get<DiscussionDetailQueryResult>(`/discussions/${encodeURIComponent(discussionId)}`)
}

export async function createComment (discussionId: number, payload: CommentCreatePayload) {
  return instance.post<null>(`/discussions/${encodeURIComponent(discussionId)}/comments`, payload)
}
