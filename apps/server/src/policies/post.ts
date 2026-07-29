import type { PostModel } from '@putongoj/shared'
import type { Context } from 'koa'
import { getDatabase } from '../config/postgres'

export interface PostState {
  post: PostModel & { id: number }
}

function buildPostState (ctx: Context, post: PostModel & { id: number }) {
  const state: PostState = { post }
  ctx.state.post = state
  return state
}

export async function loadPost (ctx: Context, inputSlug?: string) {
  const slug = String(inputSlug ?? ctx.params.slug)
  if (slug.length === 0) {
    return null
  }
  if (ctx.state.post?.post.slug === slug) {
    return ctx.state.post
  }

  const database = await getDatabase()
  const post = await database.post.findUnique({ where: { slug } })
  if (!post) {
    return null
  }

  const isAdmin = ctx.state.profile?.isAdmin ?? false
  if (!post.isPublished && !isAdmin) {
    return null
  }

  return buildPostState(ctx, post)
}
