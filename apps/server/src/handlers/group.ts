import type { Context } from 'koa'
import Router from '@koa/router'
import { GroupListQueryResultSchema } from '@putongoj/shared'
import groupService from '../services/group'
import { createEnvelopedResponse } from '../utils'

export async function findGroups (ctx: Context) {
  const groups = await groupService.findGroups()
  const result = GroupListQueryResultSchema.encode(groups)
  return createEnvelopedResponse(ctx, result)
}

function registerGroupHandlers (router: Router) {
  const groupRouter = new Router({ prefix: '/group' })

  groupRouter.get('/', findGroups)

  router.use(groupRouter.routes(), groupRouter.allowedMethods())
}

export default registerGroupHandlers
