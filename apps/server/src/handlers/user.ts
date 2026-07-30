import type { Context } from 'koa'
import Router from '@koa/router'
import {
  ErrorCode,
  UserItemListQueryResultSchema,
  UserProfileQueryResultSchema,
  UserRanklistExportQueryResultSchema,
  UserRanklistExportQuerySchema,
  UserRanklistQueryResultSchema,
  UserRanklistQuerySchema,
  UserSuggestQueryResultSchema,
  UserSuggestQuerySchema,
} from '@putongoj/shared'
import difference from 'lodash/difference'
import { getDatabase } from '../config/postgres'
import { adminRequire, loadProfile, loginRequire } from '../middlewares/authn'
import { dataExportLimit } from '../middlewares/ratelimit'
import userService from '../services/user'
import { createEnvelopedResponse, createErrorResponse, createZodErrorResponse } from '../utils'
import { ERR_INVALID_ID, ERR_NOT_FOUND } from '../utils/constants'

export async function loadUser (ctx: Context, input?: string) {
  const username = String(ctx.params.username || input || '').trim()
  if (!username) { ctx.throw(...ERR_INVALID_ID) }
  if (ctx.state.user?.username.toLowerCase() === username.toLowerCase()) { return ctx.state.user }

  const user = await userService.getUser(username)
  if (!user) { ctx.throw(...ERR_NOT_FOUND) }
  ctx.state.user = user
  return user
}

export async function findRanklist (ctx: Context) {
  const query = UserRanklistQuerySchema.safeParse(ctx.request.query)
  if (!query.success) { return createZodErrorResponse(ctx, query.error) }
  const result = await userService.findRanklist(query.data)
  return createEnvelopedResponse(ctx, UserRanklistQueryResultSchema.encode(result))
}

export async function exportRanklist (ctx: Context) {
  const query = UserRanklistExportQuerySchema.safeParse(ctx.request.query)
  if (!query.success) { return createZodErrorResponse(ctx, query.error) }

  const profile = await loadProfile(ctx)
  if (!query.data.groupId && !profile.isAdmin) {
    return createErrorResponse(ctx, ErrorCode.Forbidden, 'Insufficient privilege to export full ranklist')
  }
  const result = await userService.exportRanklist(query.data)
  return createEnvelopedResponse(ctx, UserRanklistExportQueryResultSchema.encode(result))
}

export async function getUser (ctx: Context) {
  const user = await loadUser(ctx)
  const database = await getDatabase()
  const [ statuses, groups, heatmap, codeforces ] = await Promise.all([
    database.userProblemStatus.findMany({ where: { userId: user.id }, select: { problemId: true, hasAccepted: true } }),
    database.groupMember.findMany({ where: { userId: user.id }, include: { group: true } }),
    userService.getSubmissionHeatmap(user.id),
    userService.getCodeforcesProfile(user.id),
  ])
  const solved = statuses.filter(status => status.hasAccepted).map(status => status.problemId)
  const attempted = difference(statuses.map(status => status.problemId), solved)
  return createEnvelopedResponse(ctx, UserProfileQueryResultSchema.encode({
    ...user,
    groups: groups.map(({ group }) => ({ id: group.id, name: group.name })),
    solved,
    attempted,
    codeforces,
    submissionHeatmap: heatmap,
  }))
}

export async function suggestUsers (ctx: Context) {
  const query = UserSuggestQuerySchema.safeParse(ctx.request.query)
  if (!query.success) { return createZodErrorResponse(ctx, query.error) }
  const result = await userService.suggestUsers(query.data.keyword, 10)
  return createEnvelopedResponse(ctx, UserSuggestQueryResultSchema.encode(result))
}

export async function getAllUserItems (ctx: Context) {
  const result = await userService.getAllUserItems()
  return createEnvelopedResponse(ctx, UserItemListQueryResultSchema.encode(result))
}

export default function registerUserHandlers (router: Router) {
  const userRouter = new Router({ prefix: '/users' })
  userRouter.get('/items', adminRequire, getAllUserItems)
  userRouter.get('/suggest', loginRequire, suggestUsers)
  userRouter.get('/ranklist', findRanklist)
  userRouter.get('/ranklist/export', loginRequire, dataExportLimit, exportRanklist)
  userRouter.get('/:username', getUser)
  router.use(userRouter.routes(), userRouter.allowedMethods())
}
