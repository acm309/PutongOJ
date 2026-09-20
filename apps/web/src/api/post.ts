import type {
  PostDetailQueryResult,
  PostListQuery,
  PostListQueryResult,
} from '@putong-oj/shared'
import { apiClient } from './instance'

export async function findPosts (params: PostListQuery) {
  return apiClient.get<PostListQueryResult>('/posts', { params })
}

export async function getPost (slug: string) {
  return apiClient.get<PostDetailQueryResult>(`/posts/${encodeURIComponent(slug)}`)
}
