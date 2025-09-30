import type { Context } from 'koa'
import userServices from '../services/user'
import {
  AdminUsersQueryResultSchema,
  AdminUsersQuerySchema,
} from '../types'
import { createEnvelopedResponse, createZodErrorResponse } from '../utils'

export async function findUsers (ctx: Context) {
  const query = AdminUsersQuerySchema.safeParse(ctx.request.query)
  if (!query.success) {
    return createZodErrorResponse(ctx, query.error)
  }

  const users = await userServices.findUsers(query.data)
  const result = AdminUsersQueryResultSchema.encode(users)
  return createEnvelopedResponse(ctx, result)
}

const adminController = {
  findUsers,
} as const

export default adminController
