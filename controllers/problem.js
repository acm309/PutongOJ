const path = require('node:path')
const fse = require('fs-extra')
const escapeRegExp = require('lodash.escaperegexp')
const only = require('only')
const config = require('../config')
const Contest = require('../models/Contest')
const Problem = require('../models/Problem')
const Solution = require('../models/Solution')
const { isLogined, isAdmin } = require('../utils/helper')
const logger = require('../utils/logger')

const preload = async (ctx, next) => {
  const pid = Number.parseInt(ctx.params.pid)
  const cid = Number.parseInt(ctx.request.query.cid) || 0
  if (Number.isNaN(pid)) { ctx.throw(400, 'Pid has to be a number') }
  const problem = await Problem.findOne({ pid }).exec()
  if (problem == null) { ctx.throw(400, 'No such a problem') }
  if (isAdmin(ctx.session.profile)) {
    ctx.state.problem = problem
    return next()
  }
  if (cid > 0) {
    const contest = await Contest.findOne({ cid }).exec()
    if (contest.start > Date.now() || (contest.encrypt !== config.encrypt.Public && !ctx.session.profile.verifyContest.includes(contest.cid))) {
      ctx.throw(400, 'You do not have permission to enter this problem!')
    }
    if (contest.encrypt === config.encrypt.Public && !ctx.session.profile.verifyContest.includes(contest.cid)) {
      ctx.session.profile.verifyContest.push(contest.cid)
    }
    ctx.state.problem = problem
    return next()
  }
  if (problem.status === config.status.Reserve) {
    ctx.throw(400, 'You do not have permission to enter this problem!')
  }
  ctx.state.problem = problem
  return next()
}

// 返回题目列表
const find = async (ctx) => {
  const opt = ctx.request.query
  const filter = {}
  const page = Number.parseInt(opt.page) || 1
  const pageSize = Number.parseInt(opt.pageSize) || 30
  if (opt.content) {
    if (opt.type === 'tag') {
      filter.tags = {
        $in: [ new RegExp(escapeRegExp(opt.content), 'i') ],
      }
    } else {
      // https://stackoverflow.com/questions/2908100/mongodb-regex-search-on-integer-value
      filter.$expr = {
        $regexMatch: {
          input: { $toString: `$${opt.type}` },
          regex: new RegExp(escapeRegExp(opt.content), 'i'),
        },
      }
    }
  }

  let list
  if (page !== -1) {
    if (!isAdmin(ctx.session.profile)) {
      filter.status = config.status.Available
    }
    list = await Problem.paginate(filter, {
      sort: { pid: 1 },
      page,
      limit: pageSize,
      lean: true,
      leanWithId: false,
      select: '-_id pid title status type tags submit solve',
    })
  } else {
    const docs = await Problem.find({}, { title: 1, pid: 1, _id: 0 }).lean().exec()
    list = {
      docs,
      total: docs.length,
    }
  }

  let solved = []
  if (isLogined(ctx)) {
    const query = Solution.find({
      uid: ctx.session.profile.uid,
      judge: config.judge.Accepted,
    })
    // 缩小查询范围
    if (list.length > 0) {
      query
        .where('pid')
        .gte(list.docs[0].pid)
        .lte(list.docs[list.total - 1].pid)
    }
    solved = await query.distinct('pid').lean().exec()
  }

  ctx.body = {
    list,
    solved,
  }
}

// 返回一道题目
const findOne = async (ctx) => {
  const problem = ctx.state.problem
  const profile = ctx.session.profile

  let fields = 'pid title time memory status type tags '
    + 'description input output in out hint'
  if (isAdmin(profile)) { fields += ' code' }

  ctx.body = { problem: only(problem, fields) }
}

// 新建一个题目
const create = async (ctx) => {
  const opt = ctx.request.body

  const problem = new Problem(Object.assign(
    only(opt, 'title description input output in out hint type code'),
    { // pid 会自动生成
      time: Number.parseInt(opt.time) || 1000,
      memory: Number.parseInt(opt.memory) || 32768,
    },
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
   * @param {object} object
   * @param {object} options
   */
  // 把 object 写入到 file 中，如果 file 不存在，就创建它
  fse.outputJsonSync(path.resolve(dir, 'meta.json'), {
    testcases: [],
  }, { spaces: 2 }) // 缩进2个空格
  logger.info(`Testcase info for problem ${problem.pid} is created`)

  ctx.body = {
    pid: problem.pid,
  }
}

// 更新一道题目
const update = async (ctx) => {
  const opt = ctx.request.body
  const problem = ctx.state.problem
  const fields = [
    'title', 'time', 'memory', 'description', 'input', 'output',
    'in', 'out', 'hint', 'status', 'type', 'code' ]

  fields.filter(field => opt[field] !== null).forEach((field) => {
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
    pid: problem.pid,
  }
}

// 删除一道题目
const del = async (ctx) => {
  const pid = ctx.params.pid

  try {
    await Problem.deleteOne({ pid }).exec()
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
  del,
}
