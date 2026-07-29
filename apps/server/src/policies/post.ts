import type { PostModel } from '@putongoj/shared'
import type { Context } from 'koa'
import type { WithId } from '../types'
import Post from '../models/Post'

export interface PostState {
  post: WithId<PostModel>
}

function buildPostState (ctx: Context, post: WithId<PostModel>) {
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

  const post = await Post.findOne({ slug }).lean()
  if (!post) {
    return null
  }

  const isAdmin = ctx.state.profile?.isAdmin ?? false
  if (!post.isPublished && !isAdmin) {
    return null
  }

  return buildPostState(ctx, post)
}
