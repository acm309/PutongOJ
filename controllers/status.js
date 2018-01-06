const only = require('only')
const Solution = require('../models/Solution')
const { purify } = require('../utils/helper')
const logger = require('../utils/logger')

// 返回提交列表
const list = async (ctx) => {
  const opt = ctx.request.query
  const page = parseInt(opt.page) || 1
  const pageSize = parseInt(opt.pageSize) || 30
  const filter = purify(only(opt, 'uid pid judge language mid'))
  const res = await Solution.paginate(filter, {
    sort: { sid: -1 },
    page,
    limit: pageSize,
    select: '-_id -code -error'
  })

  ctx.body = {
    res
  }
}

// 返回一个提交
const findOne = async (ctx) => {
  const opt = parseInt(ctx.query.sid)
  const doc = await Solution.findOne({ sid: opt }).exec()

  ctx.body = {
    doc
  }
}

const create = async (ctx) => {
  const { pid, code, language } = ctx.request.body
  const { uid } = ctx.session.profile
  const solution = new Solution({
    pid: +pid,
    uid,
    code,
    language,
    length: Buffer.from(code).length // 这个属性是不是没啥用?
  })

  try {
    await solution.save()
    logger.info(`One problem is updated" ${solution.pid} -- ${solution.uid}`)
  } catch (e) {
    ctx.throw(400, e.message)
  }

  ctx.body = {}
}

module.exports = {
  list,
  findOne,
  create
}
