const User = require('../models/User')

/**
 * 返回排行榜
 */
const find = async (ctx) => {
  const opt = ctx.request.query
  const page = Number.parseInt(opt.page) || 1
  const pageSize = Number.parseInt(opt.pageSize) || 30
  const filter = {
    solve: { $gt: 0 },
    privilege: { $ne: 0 },
  }
  if (opt.gid && !Number.isNaN(Number.parseInt(opt.gid))) {
    filter.gid = Number.parseInt(opt.gid)
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

module.exports = {
  find,
}
