import type { Context } from 'koa'
import Router from '@koa/router'
import { TagListQueryResultSchema } from '@putong-oj/shared'
import tagService from '../services/tag.ts'
import { createEnvelopedResponse } from '../utils/index.ts'

export async function findTags (ctx: Context) {
  const tags = await tagService.getTags()
  const result = TagListQueryResultSchema.encode(tags)
  return createEnvelopedResponse(ctx, result)
}

function registerTagHandlers (router: Router) {
  const tagRouter = new Router({ prefix: '/tags' })

  tagRouter.get('/', findTags)

  router.use(tagRouter.routes(), tagRouter.allowedMethods())
}

export default registerTagHandlers
