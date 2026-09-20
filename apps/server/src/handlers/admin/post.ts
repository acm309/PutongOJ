import type Router from '@koa/router'
import type { PostModel } from '@putong-oj/shared'
import type { Context } from 'koa'
import type { QueryFilter } from '../../types/mongo.ts'
import {
  AdminPostCreatePayloadSchema,
  AdminPostDetailQueryResultSchema,
  AdminPostListQueryResultSchema,
  AdminPostListQuerySchema,
  AdminPostUpdatePayloadSchema,
  ErrorCode,
} from '@putong-oj/shared'
import escapeRegExp from 'lodash/escapeRegExp.js'
import { loadProfile, rootRequire } from '../../middlewares/authn.ts'
import { loadPost } from '../../policies/post.ts'
import { postService } from '../../services/post.ts'
import {
  createEnvelopedResponse,
  createErrorResponse,
  createZodErrorResponse,
} from '../../utils/index.ts'

export async function findPosts (ctx: Context) {
  const query = AdminPostListQuerySchema.safeParse(ctx.request.query)
  if (!query.success) {
    return createZodErrorResponse(ctx, query.error)
  }

  const { page, pageSize, sort, sortBy, title, isPublished, isPinned, isHidden } = query.data
  const filters: QueryFilter<PostModel> = {}
  if (title) {
    filters.title = { $regex: escapeRegExp(title), $options: 'i' }
  }
  if (isPublished !== undefined) {
    filters.isPublished = isPublished
  }
  if (isPinned !== undefined) {
    filters.isPinned = isPinned
  }
  if (isHidden !== undefined) {
    filters.isHidden = isHidden
  }
  const posts = await postService.findPosts(
    { page, pageSize, sort, sortBy },
    filters)
  const result = AdminPostListQueryResultSchema.encode(posts)
  return createEnvelopedResponse(ctx, result)
}

export async function getPost (ctx: Context) {
  await loadProfile(ctx)
  const postState = await loadPost(ctx)
  if (!postState) {
    return createErrorResponse(ctx, ErrorCode.NotFound, 'Post not found')
  }

  const result = AdminPostDetailQueryResultSchema.encode(postState.post)
  return createEnvelopedResponse(ctx, result)
}

export async function createPost (ctx: Context) {
  const payload = AdminPostCreatePayloadSchema.safeParse(ctx.request.body)
  if (!payload.success) {
    return createZodErrorResponse(ctx, payload.error)
  }

  const profile = await loadProfile(ctx)
  const { title } = payload.data

  try {
    const post = await postService.createPost({ title })
    ctx.auditLog.info(`<Post:${post.slug}> created by <User:${profile.uid}>`)
    return createEnvelopedResponse(ctx, { slug: post.slug })
  } catch (err: any) {
    ctx.auditLog.error('Failed to create post', err)
    if (err.code === 11000) {
      return createErrorResponse(ctx, ErrorCode.BadRequest, 'Slug already exists')
    }
    return createErrorResponse(ctx, ErrorCode.InternalServerError)
  }
}

export async function updatePost (ctx: Context) {
  const payload = AdminPostUpdatePayloadSchema.safeParse(ctx.request.body)
  if (!payload.success) {
    return createZodErrorResponse(ctx, payload.error)
  }

  const profile = await loadProfile(ctx)
  const postState = await loadPost(ctx)
  if (!postState) {
    return createErrorResponse(ctx, ErrorCode.NotFound, 'Post not found')
  }
  const { slug } = payload.data
  const post = postState.post

  try {
    if (slug && slug !== post.slug) {
      const exists = await postService.isSlugTaken(slug, post._id)
      if (exists) {
        return createErrorResponse(ctx, ErrorCode.BadRequest, 'Slug already exists')
      }
    }

    const updated = await postService.updatePostById(post._id, payload.data)
    if (!updated) {
      return createErrorResponse(ctx, ErrorCode.NotFound, 'Post not found')
    }

    ctx.auditLog.info(`<Post:${updated.slug}> updated by <User:${profile.uid}>`)
    return createEnvelopedResponse(ctx, { slug: updated.slug })
  } catch (err: any) {
    ctx.auditLog.error('Failed to update post', err)
    if (err.code === 11000) {
      return createErrorResponse(ctx, ErrorCode.BadRequest, 'Slug already exists')
    }
    return createErrorResponse(ctx, ErrorCode.InternalServerError)
  }
}

export async function deletePost (ctx: Context) {
  const profile = await loadProfile(ctx)
  const postState = await loadPost(ctx)
  if (!postState) {
    return createErrorResponse(ctx, ErrorCode.NotFound, 'Post not found')
  }

  try {
    await postService.deletePostById(postState.post._id)
    ctx.auditLog.info(`<Post:${postState.post.slug}> deleted by <User:${profile.uid}>`)
    return createEnvelopedResponse(ctx, null)
  } catch (err: any) {
    ctx.auditLog.error('Failed to delete post', err)
    return createErrorResponse(ctx, ErrorCode.InternalServerError)
  }
}

function registerAdminPostHandlers (router: Router) {
  router.get('/posts', findPosts)
  router.post('/posts', createPost)
  router.get('/posts/:slug', getPost)
  router.put('/posts/:slug', updatePost)
  router.delete('/posts/:slug', rootRequire, deletePost)
}

export default registerAdminPostHandlers
