import type { Context } from 'koa'
import type { UserDocument } from '../models/User'
import { Buffer } from 'node:buffer'
import { md5 } from '@noble/hashes/legacy.js'
import { UserProfileQueryResultSchema } from '@putongoj/shared'
import difference from 'lodash/difference'
import escapeRegExp from 'lodash/escapeRegExp'
import config from '../config'
import Group from '../models/Group'
import Solution from '../models/Solution'
import User from '../models/User'
import userServices from '../services/user'
import { createEnvelopedResponse } from '../utils'
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

  const user = await userServices.getUser(uid)
  if (!user) {
    ctx.throw(...ERR_NOT_FOUND)
  }

  ctx.state.user = user
  return user
}

const find = async (ctx: Context) => {
  const profile = ctx.state.profile
  const opt = ctx.request.query
  const page = Number.parseInt(opt.page as string) || 1
  const pageSize = Number.parseInt(opt.pageSize as string) || 30
  const privilege = String(opt.privilege || '')
  const filterType = String(opt.type || 'nick')
  const filterContent = String(opt.content || '')

  const filter: Record<string, any> = {}
  if (privilege === 'admin' && profile?.isAdmin) {
    filter.privilege = { $in: [ config.privilege.Admin, config.privilege.Root ] }
  }
  if (filterType === 'uid' || filterType === 'name') {
    filter.$or = [
      { uid: { $regex: new RegExp(escapeRegExp(filterContent), 'i') } },
      { nick: { $regex: new RegExp(escapeRegExp(filterContent), 'i') } },
    ]
  }
  let result
  if (page !== -1) {
    result = await User.paginate(filter, {
      sort: { createdAt: -1 },
      page,
      limit: pageSize,
      lean: true,
      leanWithId: false,
      select: '-_id uid nick privilege createdAt',
    })
  } else {
    const docs = await User.find(filter, { uid: 1, nick: 1, _id: 0 }).lean().exec()
    result = {
      docs,
      total: docs.length,
    }
  }
  ctx.body = result
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

  let avatarHash: string | null = null
  if (user.isAdmin && user.mail) {
    const mail = user.mail.trim().toLowerCase()
    const hash = md5(Buffer.from(mail))
    avatarHash = Buffer.from(hash).toString('hex')
  }

  const attempted = difference(failed, solved)
  const result = UserProfileQueryResultSchema.encode({
    ...user.toObject(), avatarHash, groups, solved, attempted,
  })
  return createEnvelopedResponse(ctx, result)
}

const userController = {
  find,
  getUser,
} as const

export default userController
