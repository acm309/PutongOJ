import type { UserProfileQueryResult } from '@putongoj/shared'
import type { Context } from 'koa'
import type { UserDocument } from '../models/User'
import {
  OAuthProvider,
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
import config from '../config'
import { loadProfile } from '../middlewares/authn'
import Group from '../models/Group'
import Solution from '../models/Solution'
import oauthService from '../services/oauth'
import userService from '../services/user'
import {
  createEnvelopedResponse,
  createErrorResponse,
  createZodErrorResponse,
} from '../utils'
import { ERR_INVALID_ID, ERR_NOT_FOUND } from '../utils/error'

export async function loadUser (
  ctx: Context,
  input?: string,
): Promise<UserDocument> {
  const uid = String(ctx.params.uid || input || '').trim()
  if (!uid) {
    ctx.throw(...ERR_INVALID_ID)
  }
  if (ctx.state.user?.uid === uid) {
    return ctx.state.user
  }

  const user = await userService.getUser(uid)
  if (!user) {
    ctx.throw(...ERR_NOT_FOUND)
  }

  ctx.state.user = user
  return user
}

export async function findRanklist (ctx: Context) {
  const query = UserRanklistQuerySchema.safeParse(ctx.request.query)
  if (!query.success) {
    return createZodErrorResponse(ctx, query.error)
  }

  const users = await userService.findRanklist(query.data)
  const result = UserRanklistQueryResultSchema.encode(users)
  return createEnvelopedResponse(ctx, result)
}

export async function exportRanklist (ctx: Context) {
  const query = UserRanklistExportQuerySchema.safeParse(ctx.request.query)
  if (!query.success) {
    return createZodErrorResponse(ctx, query.error)
  }
  const profile = await loadProfile (ctx)
  if (!query.data.group && !profile.isAdmin) {
    return createErrorResponse(ctx, 'Insufficient privilege to export full ranklist', 403)
  }

  const users = await userService.exportRanklist(query.data)
  const result = UserRanklistExportQueryResultSchema.encode(users)
  return createEnvelopedResponse(ctx, result)
}

export async function getUser (ctx: Context) {
  const user = await loadUser(ctx)
  const [ solved, failed, groups ] = await Promise.all([
    Solution
      .find({ uid: user.uid, judge: config.judge.Accepted })
      .distinct('pid')
      .lean(),
    Solution
      .find({ uid: user.uid, judge: { $nin: [ config.judge.Accepted, config.judge.Skipped ] } })
      .distinct('pid')
      .lean(),
    Group
      .find({ gid: { $in: user.gid } })
      .select('-_id gid title')
      .lean(),
  ])

  let codeforces: UserProfileQueryResult['codeforces'] = null
  const codeforcesConnection = await oauthService.getUserOAuthConnection(
    user._id, OAuthProvider.Codeforces)
  if (codeforcesConnection?.raw?.handle && codeforcesConnection?.raw?.rating) {
    const { handle, rating } = codeforcesConnection.raw
    if (typeof handle === 'string' && typeof rating === 'number') {
      codeforces = { handle, rating }
    }
  }

  const attempted = difference(failed, solved)
  const result = UserProfileQueryResultSchema.encode({
    ...user.toObject(), groups, solved, attempted, codeforces,
  })
  return createEnvelopedResponse(ctx, result)
}

export async function suggestUsers (ctx: Context) {
  const query = UserSuggestQuerySchema.safeParse(ctx.request.query)
  if (!query.success) {
    return createZodErrorResponse(ctx, query.error)
  }

  const users = await userService.suggestUsers(query.data.keyword, 10)
  const result = UserSuggestQueryResultSchema.encode(users)
  return createEnvelopedResponse(ctx, result)
}

export async function getAllUserItems (ctx: Context) {
  const users = await userService.getAllUserItems()
  const result = UserItemListQueryResultSchema.encode(users)
  return createEnvelopedResponse(ctx, result)
}

const userController = {
  findRanklist,
  exportRanklist,
  getUser,
  suggestUsers,
  getAllUserItems,
} as const

export default userController
