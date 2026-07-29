import type Router from '@koa/router'
import type { Context } from 'koa'
import {
  ErrorCode,
  PostDetailQueryResultSchema,
  PostListQueryResultSchema,
  PostListQuerySchema,
} from '@putongoj/shared'
import { loadPost } from '../policies/post'
import { postService } from '../services/post'
import {
  createEnvelopedResponse,
  createErrorResponse,
  createZodErrorResponse,
} from '../utils'

async function findPosts (ctx: Context) {
  const query = PostListQuerySchema.safeParse(ctx.request.query)
  if (!query.success) {
    return createZodErrorResponse(ctx, query.error)
  }

  const { page, pageSize } = query.data
  const posts = await postService.findPosts(
    { page, pageSize, sortBy: 'publishesAt', sort: -1 },
    { isPublished: true, isHidden: false })
  const result = PostListQueryResultSchema.encode(posts)
  return createEnvelopedResponse(ctx, result)
}

async function getPost (ctx: Context) {
  const postState = await loadPost(ctx)
  if (!postState) {
    return createErrorResponse(ctx, ErrorCode.NotFound, 'Post not found')
  }

  const result = PostDetailQueryResultSchema.encode(postState.post)
  return createEnvelopedResponse(ctx, result)
}

function registerPostHandlers (router: Router) {
  router.get('/posts', findPosts)
  router.get('/posts/:slug', getPost)
}

export default registerPostHandlers
