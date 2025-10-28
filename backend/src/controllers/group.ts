import type { Context } from 'koa'
import { GroupListQueryResultSchema } from '@putongoj/shared'
import groupService from '../services/group'
import { createEnvelopedResponse } from '../utils'

export async function findGroups (ctx: Context) {
  const groups = await groupService.findGroups()
  const result = GroupListQueryResultSchema.encode(groups)
  return createEnvelopedResponse(ctx, result)
}

const groupController = {
  findGroups,
} as const

export default groupController
