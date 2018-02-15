const only = require('only')
const fse = require('fs-extra')
const path = require('path')
const config = require('../config')
const Problem = require('../models/Problem')
const Solution = require('../models/Solution')
const logger = require('../utils/logger')
const { isLogined } = require('../utils/helper')

const preload = async (ctx, next) => {
  const pid = parseInt(ctx.params.pid)
  if (isNaN(pid)) ctx.throw(400, 'Pid has to be a number')
  const problem = await Problem.findOne({ pid }).exec()
  if (problem == null) ctx.throw(400, 'No such a problem')
  ctx.state.problem = problem
  return next()
}

// 返回题目列表
const find = async (ctx) => {
  const opt = ctx.request.query
  const filter = {}
  const page = parseInt(opt.page) || 1
  const pageSize = parseInt(opt.pageSize) || 30
  if (opt.content) {
    if (opt.type === 'tag') {
      filter.tags = {
        $in: [new RegExp(opt.content, 'i')]
      }
    } else {
      filter.$where =
        `${new RegExp(opt.content, 'i')}.test(this["${opt.type}"])`
    }
  }

  let list
  if (page !== -1) {
    // 使用mongoose-paginate包简化
    list = await Problem.paginate(filter, {
      sort: { pid: 1 },
      page,
      limit: pageSize,
      select: '-_id -hint -description -in -out -input -output' // -表示不要的字段
    })
  } else {
    const docs = await Problem.find({}).exec()
    list = {
      docs,
      total: docs.length
    }
  }

  let solved = []
  if (isLogined(ctx)) {
    const query = Solution.find({
      uid: ctx.session.profile.uid,
      judge: config.judge.Accepted
    })
    // 缩小查询范围
    if (list.length > 0) {
      query
        .where('pid')
        .gte(list.docs[0].pid)
        .lte(list.docs[list.total - 1].pid)
    }
    solved = await query.distinct('pid').exec()
  }

  ctx.body = {
    list,
    solved
  }
}

// 返回一道题目
const findOne = async (ctx) => {
  const problem = ctx.state.problem

  ctx.body = {
    problem
  }
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

  const dir = path.resolve(__dirname, `../data/${problem.pid}`)
  fse.ensureDirSync(dir) // 如果dir这个文件夹不存在，就创建它

  /**
   * outputJsonSync (file, object, options)
   * @param {string} file
   * @param {Object} object
   * @param {Object} options
   */
  // 把 object 写入到 file 中，如果 file 不存在，就创建它
  fse.outputJsonSync(path.resolve(dir, 'meta.json'), {
    testcases: []
  }, { spaces: 2 }) // 缩进2个空格
  logger.info(`Testcase info for problem ${problem.pid} is created`)

  ctx.body = {
    pid: problem.pid
  }
}

// 更新一道题目
const update = async (ctx) => {
  const opt = ctx.request.body
  const problem = ctx.state.problem
  const fields = ['title', 'time', 'memory', 'description', 'input', 'output', 'hint', 'in', 'out', 'status']
  fields.forEach((field) => {
    problem[field] = opt[field]
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
  find,
  findOne,
  create,
  update,
  del
}
