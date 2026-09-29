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
  return apiClient.post<{ id: string }>('/discussions', payload)
}
export async function getDiscussion (discussionId: string) {
  return apiClient.get<DiscussionDetailQueryResult>(`/discussions/${encodeURIComponent(discussionId)}`)
}

export async function createComment (discussionId: string, payload: CommentCreatePayload) {
  return apiClient.post<null>(`/discussions/${encodeURIComponent(discussionId)}/comments`, payload)
}
