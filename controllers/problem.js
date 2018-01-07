const only = require('only')
const Problem = require('../models/Problem')
const logger = require('../utils/logger')

const preload = async (ctx, next) => {
  const pid = parseInt(ctx.params.pid)
  if (isNaN(pid)) ctx.throw(400, 'Pid has to be a number')
  const problem = await Problem.findOne({ pid }).exec()
  if (problem == null) ctx.throw(400, 'No such a problem')
  ctx.state.problem = problem
  return next()
}

// 返回题目列表
const list = async (ctx) => {
  const opt = ctx.request.query
  const filter = {}
  const page = parseInt(opt.page) || 1
  const pageSize = parseInt(opt.pageSize) || 30
  if (opt.content) {
    if (opt.type === 'pid') {
      filter[opt.type] = parseInt(opt.content)
    } else {
      filter[opt.type] = opt.content
    }
  }

  // 使用mongoose-paginate包简化
  const res = await Problem.paginate(filter, {
    sort: { pid: 1 },
    page,
    limit: pageSize,
    select: '-_id -hint -description -in -out -input -output' // -表示不要的字段
  })

  ctx.body = {
    res
  }
}

// 返回一道题目
const findOne = async (ctx) => {
  const problem = ctx.state.problem

  ctx.body = problem
}

// 新建一个题目
const create = async (ctx) => {
  const opt = ctx.request.body

  const problem = new Problem(Object.assign(
    only(opt, 'title description input output in out hint'),
    { // pid 会自动生成
      time: parseInt(opt.time) || 1000,
      memory: parseInt(opt.memory) || 32768
    }
  ))

  try {
    await problem.save()
    logger.info(`New problem is created" ${problem.pid} -- ${problem.title}`)
  } catch (e) {
    ctx.throw(400, e.message)
  }

  ctx.body = {
    success: true,
    pid: problem.pid
  }
}

// 更新一道题目
const update = async (ctx) => {
  const opt = ctx.request.body
  const problem = ctx.state.problem
  const fileds = ['title', 'time', 'memory', 'description', 'input', 'output', 'hint', 'in', 'out']
  fileds.forEach((filed) => {
    problem[filed] = opt[filed]
  })
  try {
    await problem.save()
    logger.info(`One problem is updated" ${problem.pid} -- ${problem.title}`)
  } catch (e) {
    ctx.throw(400, e.message)
  }

  ctx.body = {
    success: true,
    pid: problem.pid
  }
}

// 删除一道题目
const del = async (ctx) => {
  const pid = ctx.params.pid

  try {
    await Problem.deleteOne({pid}).exec()
    logger.info(`One Problem is delete ${pid}`)
  } catch (e) {
    ctx.throw(400, e.message)
  }

  ctx.body = {}
}

module.exports = {
  preload,
  list,
  findOne,
  create,
  update,
  del
}
