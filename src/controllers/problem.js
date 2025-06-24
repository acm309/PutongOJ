const path = require('node:path')
const fse = require('fs-extra')
const escapeRegExp = require('lodash/escapeRegExp')
const only = require('only')
const config = require('../config')
const Contest = require('../models/Contest')
const Problem = require('../models/Problem')
const Solution = require('../models/Solution')
const { isLogined, isAdmin } = require('../utils/helper')
const logger = require('../utils/logger')

const problemPreload = async (ctx, next) => {
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

/**
 * 查询题目列表
 */
const findProblems = async (ctx) => {
  const opt = ctx.request.query
  const { profile } = ctx.session

  /** @todo [ TO BE DEPRECATED ] 要有专门的 Endpoint 来获取所有题目 */
  if (Number.parseInt(opt.page) === -1 && isAdmin(profile)) {
    const docs = await Problem
      .find({}, { _id: 0, title: 1, pid: 1 })
      .lean()
      .exec()
    ctx.body = {
      list: {
        docs,
        total: docs.length,
      },
      solved: [],
    }
    return
  }

  const DEFAULT_PAGE_SIZE = 30
  const MAX_PAGE_SIZE = 100

  const page = Math.max(Number.parseInt(opt.page) || 1, 1)
  const pageSize = Math.max(Math.min(Number.parseInt(opt.pageSize)
    || DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE), 1)

  const filters = []
  if (!isAdmin(profile)) {
    filters.push({ status: config.status.Available })
  }

  if (opt.content) {
    if (opt.type === 'title') {
      filters.push({ title: {
        $regex: new RegExp(escapeRegExp(opt.content), 'i'),
      } })
    } else if (opt.type === 'tag') {
      filters.push({ tags: {
        $in: [ new RegExp(escapeRegExp(opt.content), 'i') ],
      } })
    } else if (opt.type === 'pid') {
      filters.push({ $expr: {
        $regexMatch: {
          input: { $toString: '$pid' },
          regex: new RegExp(`^${escapeRegExp(opt.content)}`, 'i'),
        },
      } })
    }
  }

  const { course } = ctx.state
  if (course) {
    filters.push({ course: course._id })
  } else if (!isAdmin(profile)) {
    filters.push({ $or: [
      { course: { $exists: false } },
      { course: null },
    ] })
  }

  const list = await Problem.paginate({ $and: filters }, {
    sort: { pid: 1 },
    page,
    limit: pageSize,
    lean: true,
    leanWithId: false,
    select: '-_id pid title status type tags submit solve',
  })

  let solved = []
  if (isLogined(ctx) && list.total > 0) {
    solved = await Solution
      .find({
        uid: profile.uid,
        judge: config.judge.Accepted,
        pid: { $in: list.docs.map(p => p.pid) },
      })
      .distinct('pid')
      .lean()
      .exec()
  }

  ctx.body = { list, solved }
}

// 返回一道题目
const getProblem = async (ctx) => {
  const problem = ctx.state.problem
  const profile = ctx.session.profile

  let fields = 'pid title time memory status type tags '
    + 'description input output in out hint'
  if (isAdmin(profile)) { fields += ' code' }

  ctx.body = { problem: only(problem, fields) }
}

// 新建一个题目
const createProblem = async (ctx) => {
  const opt = ctx.request.body
  const { profile: { uid } } = ctx.state

  const problem = new Problem(Object.assign(
    only(opt, 'title description input output in out hint type code'),
    { // pid 会自动生成
      time: Number.parseInt(opt.time) || 1000,
      memory: Number.parseInt(opt.memory) || 32768,
    },
  ))

  try {
    await problem.save()
    logger.info(`Problem <${problem.pid}> is created by user <${uid}>`)
  } catch (e) {
    ctx.throw(400, e.message)
  }

  const dir = path.resolve(__dirname, `../../data/${problem.pid}`)
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
  logger.info(`Testcases meta file is created for problem <${problem.pid}>`)

  ctx.body = {
    pid: problem.pid,
  }
}

// 更新一道题目
const updateProblem = async (ctx) => {
  const opt = ctx.request.body
  const problem = ctx.state.problem
  const { profile: { uid } } = ctx.state
  const fields = [
    'title', 'time', 'memory', 'description', 'input', 'output',
    'in', 'out', 'hint', 'status', 'type', 'code' ]

  fields.forEach((key) => {
    if (opt[key] !== undefined && opt[key] !== null) {
      problem[key] = opt[key]
    }
  })

  try {
    await problem.save()
    logger.info(`Problem <${problem.pid}> is updated by user <${uid}>`)
  } catch (e) {
    ctx.throw(400, e.message)
  }

  ctx.body = {
    success: true,
    pid: problem.pid,
  }
}

// 删除一道题目
const removeProblem = async (ctx) => {
  const pid = ctx.params.pid
  const { profile: { uid } } = ctx.state

  try {
    await Problem.deleteOne({ pid }).exec()
    logger.info(`Problem <${pid}> is deleted by user <${uid}>`)
  } catch (e) {
    ctx.throw(400, e.message)
  }

  ctx.body = {}
}

module.exports = {
  problemPreload,
  findProblems,
  getProblem,
  createProblem,
  updateProblem,
  removeProblem,
}
