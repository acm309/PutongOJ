import type { Context } from 'koa'
import type { TagDocument } from '../models/Tag'
import type { TagEntity, TagEntityForm, TagEntityItem, TagEntityPreview, TagEntityView } from '../types/entity'
import { pick } from 'lodash'
import { loadProfile } from '../middlewares/authn'
import tagService from '../services/tag'
import { ERR_INVALID_ID, ERR_NOT_FOUND } from '../utils/error'
import logger from '../utils/logger'

export async function loadTag (
  ctx: Context,
  inputId?: number | string,
): Promise<TagDocument> {
  const tagId = Number(
    inputId || ctx.params.tagId || ctx.request.query.tagId,
  )
  if (!Number.isInteger(tagId) || tagId <= 0) {
    return ctx.throw(...ERR_INVALID_ID)
  }
  if (ctx.state.tag?.tagId === tagId) {
    return ctx.state.tag
  }

  const tag = await tagService.getTag(tagId)
  if (!tag) {
    return ctx.throw(...ERR_NOT_FOUND)
  }

  ctx.state.tag = tag
  return tag
}

export async function findTags (ctx: Context) {
  const response: TagEntityPreview[]
    = await tagService.getTags()
  ctx.body = response
}

export async function findTagItems (ctx: Context) {
  const response: TagEntityItem[]
    = await tagService.getTagItems()
  ctx.body = response
}

export async function getTag (ctx: Context) {
  const tag = await loadTag(ctx)
  const response: TagEntityView
    = tagService.toView(tag)
  ctx.body = response
}

export async function createTag (ctx: Context) {
  const opt: Partial<TagEntityForm> = ctx.request.body
  const profile = await loadProfile(ctx)

  try {
    const tag = await tagService.createTag(
      pick(opt, [ 'name', 'color' ]),
    )
    logger.info(`Tag <${tag.tagId}> is created by user <${profile.uid}>`)
    const response: Pick<TagEntity, 'tagId'>
      = pick(tag, [ 'tagId' ])
    ctx.body = response
  } catch (e: any) {
    ctx.throw(400, e.message)
  }
}

export async function updateTag (ctx: Context) {
  const opt: Partial<TagEntityForm> = ctx.request.body
  const { tagId } = await loadTag(ctx)
  const profile = await loadProfile(ctx)

  try {
    const tag = await tagService.updateTag(
      tagId,
      pick(opt, [ 'name', 'color' ]),
    )
    if (!tag) {
      return ctx.throw(...ERR_NOT_FOUND)
    }
    logger.info(`Tag <${tag.tagId}> is updated by user <${profile.uid}>`)
    const response: { success: boolean } = { success: true }
    ctx.body = response
  } catch (e: any) {
    ctx.throw(400, e.message)
  }
}

export async function removeTag (ctx: Context) {
  const tag = await loadTag(ctx)
  const profile = await loadProfile(ctx)

  try {
    const success = await tagService.removeTag(tag.tagId)
    if (!success) {
      return ctx.throw(...ERR_NOT_FOUND)
    }
    const response: { success: boolean } = { success: true }
    ctx.body = response
    logger.info(`Tag <${tag.tagId}> is deleted by user <${profile.uid}>`)
  } catch (e: any) {
    ctx.throw(500, e.message)
  }
}

const tagController = {
  loadTag,
  findTags,
  findTagItems,
  getTag,
  createTag,
  updateTag,
  removeTag,
}

export default module.exports = tagController
