import type { Context } from 'koa'
import User from '../models/User'

/**
 * 返回排行榜
 */
const find = async (ctx: Context) => {
  const opt = ctx.request.query
  const page = Number.parseInt(opt.page as string) || 1
  const pageSize = Number.parseInt(opt.pageSize as string) || 30
  const filter: Record<string, any> = {
    solve: { $gt: 0 },
    privilege: { $ne: 0 },
  }
  if (opt.gid && !Number.isNaN(Number.parseInt(opt.gid as string))) {
    filter.gid = Number.parseInt(opt.gid as string)
  }
  const list = await User.paginate(filter, {
    sort: { solve: -1, submit: 1, create: 1 },
    page,
    limit: pageSize,
    select: '-_id uid nick motto submit solve',
    lean: true,
  })

  ctx.body = {
    list,
  }
}

const ranklistController = {
  find,
} as const

export default ranklistController
