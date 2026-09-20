import type {
  CommentCreatePayload,
  DiscussionCreatePayload,
  DiscussionDetailQueryResult,
  DiscussionListQuery,
  DiscussionListQueryResult,
} from '@putong-oj/shared'
import { apiClient } from './instance'

export async function findDiscussions (params: DiscussionListQuery) {
  return apiClient.get<DiscussionListQueryResult>('/discussions', { params })
}

export async function createDiscussion (payload: DiscussionCreatePayload) {
  return apiClient.post<{ discussionId: number }>('/discussions', payload)
}
export async function getDiscussion (discussionId: number | string) {
  return apiClient.get<DiscussionDetailQueryResult>(`/discussions/${encodeURIComponent(discussionId)}`)
}

export async function createComment (discussionId: number, payload: CommentCreatePayload) {
  return apiClient.post<null>(`/discussions/${encodeURIComponent(discussionId)}/comments`, payload)
}
