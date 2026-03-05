import type { Context } from 'koa'
import { TagListQueryResultSchema } from '@putongoj/shared'
import tagService from '../services/tag'
import { createEnvelopedResponse } from '../utils'

export async function findTagItems (ctx: Context) {
  const tags = await tagService.getTags()
  const result = TagListQueryResultSchema.encode(tags)
  return createEnvelopedResponse(ctx, result)
}

const tagController = {
  findTagItems,
} as const

export default tagController
