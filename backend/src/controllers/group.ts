import type { Context } from 'koa'
import type { UserDocument } from '../models/User'
import { GroupListQueryResultSchema } from '@putongoj/shared'
import difference from 'lodash/difference'
import without from 'lodash/without'
import { loadProfile } from '../middlewares/authn'
import Group from '../models/Group'
import User from '../models/User'
import groupServices from '../services/group'
import { createEnvelopedResponse, only } from '../utils'
import logger from '../utils/logger'

const preload = async (ctx: Context, next: () => Promise<any>) => {
  const gid = Number.parseInt(ctx.params.gid)
  if (Number.isNaN(gid)) { ctx.throw(400, 'Gid has to be a number') }
  const group = await Group.findOne({ gid }).exec()
  if (group == null) { ctx.throw(400, 'No such a group') }
  ctx.state.group = group
  return next()
}

// 返回group列表
const find = async (ctx: Context) => {
  const lean = Number.parseInt(ctx.query.lean as string) || 0
  let select = '-_id -__v'
  if (lean === 1) { select += ' -list' }
  const list = await Group.find({}).select(select).lean().exec()

  ctx.body = {
    list,
  }
}

// 返回一个group
const findOne = async (ctx: Context) => {
  const group = ctx.state.group

  ctx.body = {
    group,
  }
}

// 新建一个group
const create = async (ctx: Context) => {
  const opt = ctx.request.body
  const { uid } = await loadProfile(ctx)

  const group = new Group(Object.assign(
    only(opt, 'title list'),
    { // gid 会自动生成
      create: Date.now(),
    },
  ))

  try {
    await group.save()
    logger.info(`Group <${group.gid}> is created by user <${uid}>`)
  } catch (e: any) {
    ctx.throw(400, e.message)
  }

  const procedure = opt.list.map(async (uid: number) => {
    try {
      const user = await User.findOne({ uid }) as UserDocument
      user.gid.push(group.gid)
      const savedUser = await user.save()
      logger.info(`User <${savedUser.uid}> is added to group <${group.gid}>`)
    } catch (e: any) {
      ctx.throw(400, e.message)
    }
  })
  await Promise.all(procedure)

  ctx.body = {
    gid: group.gid,
  }
}

// 更新一个group
const update = async (ctx: Context) => {
  const opt = ctx.request.body
  const group = ctx.state.group
  const fields = [ 'title', 'list' ]
  const gid = group.gid
  const profile = await loadProfile(ctx)

  // 这些 uid 不再属于这个用户组
  const removedUids = difference(group.list, opt.list)

  // 这些 uid 被新增进这个用户组
  const importedUids = difference(opt.list, group.list)

  // 删除 user 表里的原 user 的 gid
  const delProcedure = removedUids.map(
    async (uid) => {
      try {
        const user = await User.findOne({ uid }) as UserDocument
        user.gid = without(user.gid, gid)
        user.save()
        logger.info(`User <${user.uid}> is removed from group <${gid}>`)
      } catch (e: any) {
        ctx.throw(400, e.message)
      }
    },
  )
  await Promise.all(delProcedure)

  fields.forEach((field) => {
    group[field] = opt[field]
  })

  // 新增 user 表里 user 的 gid
  const addProcedure = importedUids.map(
    async (uid) => {
      try {
        const user = await User.findOne({ uid }) as UserDocument
        user.gid.push(gid)
        user.save()
        logger.info(`User <${user.uid}> is added to group <${gid}>`)
      } catch (e: any) {
        ctx.throw(400, e.message)
      }
    },
  )
  await Promise.all(addProcedure)

  try {
    await group.save()
    logger.info(`Group <${gid}> is updated by user <${profile.uid}>`)
  } catch (e: any) {
    ctx.throw(400, e.message)
  }

  ctx.body = {
    gid: group.gid,
  }
}

// 删除一个group
const del = async (ctx: Context) => {
  const gid = Number.parseInt(ctx.params.gid)
  const group = ctx.state.group
  const list = group.list
  const profile = await loadProfile(ctx)

  // 删除user表里的gid
  const procedure = list.map(
    async (uid: number) => {
      try {
        const user = await User.findOne({ uid }) as UserDocument
        user.gid = without(user.gid, gid)
        user.save()
        logger.info(`User <${user.uid}> is removed from group <${gid}>`)
      } catch (e: any) {
        ctx.throw(400, e.message)
      }
    },
  )
  await Promise.all(procedure)

  // 删除group表里的gid
  try {
    await Group.deleteOne({ gid }).exec()
    logger.info(`Group <${gid}> is deleted by user <${profile.uid}>`)
  } catch (e: any) {
    ctx.throw(400, e.message)
  }

  ctx.body = {}
}

export async function findGroups (ctx: Context) {
  const groups = await groupServices.findGroups()
  const result = GroupListQueryResultSchema.encode(groups)
  return createEnvelopedResponse(ctx, result)
}

const groupController = {
  preload,
  find,
  findOne,
  create,
  update,
  del,
  findGroups,
} as const

export default groupController
