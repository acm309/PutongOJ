import type { Post } from '@putongoj/db'
import type { Context } from 'koa'
import { isAdmin } from '../auth/user'
import { getDatabase } from '../config/postgres'

export interface PostState {
  post: Post
}

function buildPostState (ctx: Context, post: Post) {
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

  const canManage = ctx.state.profile !== undefined && isAdmin(ctx.state.profile)
  if (!post.isPublished && !canManage) {
    return null
  }

  return buildPostState(ctx, post)
}
