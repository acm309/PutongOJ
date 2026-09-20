import type Router from '@koa/router'
import type { Context } from 'koa'
import {
  AdminTagCreatePayloadSchema,
  AdminTagListQueryResultSchema,
  AdminTagUpdatePayloadSchema,
  ErrorCode,
} from '@putong-oj/shared'
import { loadProfile } from '../../middlewares/authn.ts'
import tagService from '../../services/tag.ts'
import {
  createEnvelopedResponse,
  createErrorResponse,
  createZodErrorResponse,
} from '../../utils/index.ts'

export async function findTags (ctx: Context) {
  const tags = await tagService.getTags()
  const result = AdminTagListQueryResultSchema.encode(tags)
  return createEnvelopedResponse(ctx, result)
}

export async function createTag (ctx: Context) {
  const payload = AdminTagCreatePayloadSchema.safeParse(ctx.request.body)
  if (!payload.success) {
    return createZodErrorResponse(ctx, payload.error)
  }

  try {
    const tag = await tagService.createTag(payload.data)
    const profile = await loadProfile(ctx)
    ctx.auditLog.info(`<Tag:${tag.tagId}> created by <User:${profile.uid}>`)
    return createEnvelopedResponse(ctx, null)
  } catch (err) {
    ctx.auditLog.error('Failed to create tag', err)
    return createErrorResponse(ctx, ErrorCode.InternalServerError)
  }
}

export async function updateTag (ctx: Context) {
  const tagIdStr = ctx.params.tagId
  const tagId = Number(tagIdStr)
  if (Number.isNaN(tagId) || !Number.isInteger(tagId) || tagId <= 0) {
    return createErrorResponse(ctx, ErrorCode.BadRequest, 'Invalid tag ID')
  }

  const payload = AdminTagUpdatePayloadSchema.safeParse(ctx.request.body)
  if (!payload.success) {
    return createZodErrorResponse(ctx, payload.error)
  }

  try {
    const success = await tagService.updateTag(tagId, payload.data)
    if (!success) {
      return createErrorResponse(ctx, ErrorCode.NotFound)
    }
    const profile = await loadProfile(ctx)
    ctx.auditLog.info(`<Tag:${tagId}> updated by <User:${profile.uid}>`)
    return createEnvelopedResponse(ctx, null)
  } catch (err) {
    ctx.auditLog.error('Failed to update tag', err)
    return createErrorResponse(ctx, ErrorCode.InternalServerError)
  }
}

function registerAdminTagHandlers (router: Router) {
  router.get('/tags', findTags)
  router.post('/tags', createTag)
  router.put('/tags/:tagId', updateTag)
}

export default registerAdminTagHandlers
