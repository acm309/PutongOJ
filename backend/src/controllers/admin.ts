import type { Context } from 'koa'
import {
  AdminUserListQueryResultSchema,
  AdminUserListQuerySchema,
} from '@putongoj/shared'
import userServices from '../services/user'
import { createEnvelopedResponse, createZodErrorResponse } from '../utils'

export async function findUsers (ctx: Context) {
  const query = AdminUserListQuerySchema.safeParse(ctx.request.query)
  if (!query.success) {
    return createZodErrorResponse(ctx, query.error)
  }

  const users = await userServices.findUsers(query.data)
  const result = AdminUserListQueryResultSchema.encode(users)
  return createEnvelopedResponse(ctx, result)
}

const adminController = {
  findUsers,
} as const

export default adminController
