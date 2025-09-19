import type { Context } from 'koa'
import type { UserDocument } from '../models/User'
import difference from 'lodash/difference'
import escapeRegExp from 'lodash/escapeRegExp'
import { loadProfile } from 'src/middlewares/authn'
import { ERR_INVALID_ID, ERR_NOT_FOUND } from 'src/utils/error'
import config from '../config'
import Group from '../models/Group'
import Solution from '../models/Solution'
import User from '../models/User'
import { generatePwd, isComplexPwd, only } from '../utils'
import logger from '../utils/logger'

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

  const user = await User.findOne({ uid })
  if (!user) {
    ctx.throw(...ERR_NOT_FOUND)
  }

  ctx.state.user = user
  return user
}

const find = async (ctx: Context) => {
  const profile = await loadProfile(ctx)
  const opt = ctx.request.query
  const page = Number.parseInt(opt.page as string) || 1
  const pageSize = Number.parseInt(opt.pageSize as string) || 30
  const privilege = String(opt.privilege || '')
  const filterType = String(opt.type || 'nick')
  const filterContent = String(opt.content || '')

  const filter: Record<string, any> = {}
  if (privilege === 'admin' && profile.isAdmin) {
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

const findOne = async (ctx: Context) => {
  const user = await loadUser(ctx)
  const [ solved, failed, groups ] = await Promise.all([
    Solution
      .find({ uid: user.uid, judge: config.judge.Accepted })
      .distinct('pid')
      .lean()
      .exec(),
    Solution
      .find({ uid: user.uid, judge: { $ne: config.judge.Accepted } })
      .distinct('pid')
      .lean()
      .exec(),
    Group
      .find({ gid: { $in: user.gid } })
      .select('-_id gid title')
      .lean()
      .exec(),
  ])

  ctx.body = {
    user: {
      ...only(user, 'uid nick motto mail school privilege createdAt'),
      groups,
    },
    solved,
    unsolved: difference(failed, solved),
  }
}

const create = async (ctx: Context) => {
  const opt = ctx.request.body
  const uid = String(opt.uid || '')
  const pwd = String(opt.pwd || '')
  const nick = String(opt.nick || '')

  if (!isComplexPwd(pwd)) {
    ctx.throw(400, 'The password is not complex enough!')
  }
  const exists = await User.findOne({
    uid: { $regex: new RegExp(`^${escapeRegExp(uid)}$`, 'i') },
  }).exec()
  if (exists) {
    ctx.throw(400, 'The username has been registered!')
  }
  const user = new User({
    uid, nick, pwd: generatePwd(pwd),
  })

  try {
    await user.save()
    const { requestId = 'unknown' } = ctx.state
    logger.info(`User <${user.uid}> is created [${requestId}]`)
  } catch (err: any) {
    ctx.throw(400, err.message)
  }
  ctx.body = {}
}

const update = async (ctx: Context) => {
  const profile = await loadProfile(ctx)
  const user = await loadUser(ctx)

  if (!(
    profile.uid === user.uid || (
      user.privilege === config.privilege.Root
        ? profile.isRoot
        : profile.isAdmin
    ))
  ) {
    ctx.throw(403, 'You don\'t have permission to change this user\'s information!')
  }

  const opt = ctx.request.body
  const fields = [ 'nick', 'motto', 'school', 'mail' ] as const
  fields.forEach((field) => {
    if (typeof opt[field] === 'string') {
      user[field] = opt[field]
    }
  })

  const privilege = Number.parseInt(opt.privilege ?? user.privilege)
  if (privilege !== user.privilege && !(
    profile.isRoot
    && profile.uid !== user.uid
  )) {
    ctx.throw(403, 'You don\'t have permission to change the privilege!')
  }
  user.privilege = privilege

  const oldPwd = String(opt.oldPwd || '')
  const newPwd = String(opt.newPwd || '')
  if (newPwd !== '') {
    if (user.pwd !== generatePwd(oldPwd) && !profile.isAdmin) {
      ctx.throw(400, 'Old password is wrong!')
    }
    if (!isComplexPwd(newPwd)) {
      ctx.throw(400, 'The new password is not complex enough!')
    }
    user.pwd = generatePwd(newPwd)
  }

  try {
    await user.save()
    logger.info(`User <${user.uid}> is updated by user <${profile.uid}>`)
  } catch (e: any) {
    ctx.throw(400, e.message)
  }
  ctx.body = {}
}

const userController = {
  find,
  findOne,
  create,
  update,
}

export default userController
