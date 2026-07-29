import type {
  PostDetailQueryResult,
  PostListQuery,
  PostListQueryResult,
} from '@putongoj/shared'
import { instanceSafe as instance } from './instance'

export async function findPosts (params: PostListQuery) {
  return instance.get<PostListQueryResult>('/posts', { params })
}

export async function getPost (slug: string) {
  return instance.get<PostDetailQueryResult>(`/posts/${encodeURIComponent(slug)}`)
}
