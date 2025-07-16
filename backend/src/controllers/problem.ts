import type { Context } from 'koa'
import type { ProblemDocument } from '../models/Problem'
import type { Paginated } from '../types'
import path from 'node:path'
import fse from 'fs-extra'
import escapeRegExp from 'lodash/escapeRegExp'
import { loadProfile } from '../middlewares/authn'
import Contest from '../models/Contest'
import Problem from '../models/Problem'
import Solution from '../models/Solution'
import { parsePaginateOption } from '../utils'
import constants from '../utils/constants'
import { ERR_INVALID_ID, ERR_NOT_FOUND, ERR_PERM_DENIED } from '../utils/error'
import logger from '../utils/logger'
import { loadCourse } from './course'

const { encrypt, status, judge } = constants

export async function loadProblem (
  ctx: Context,
  inputId?: string | number,
): Promise<{ problem: ProblemDocument }> {
  const problemId = Number(
    inputId || ctx.params.pid || ctx.request.query.pid,
  )
  if (!Number.isInteger(problemId) || problemId <= 0) {
    return ctx.throw(...ERR_INVALID_ID)
  }
  if (ctx.state.problem?.pid === problemId) {
    return { problem: ctx.state.problem }
  }

  const problem = await Problem.findOne({ pid: problemId })
  if (!problem) {
    return ctx.throw(...ERR_NOT_FOUND)
  }

  const { profile } = ctx.state
  if (problem.status === status.Available || profile?.isAdmin) {
    ctx.state.problem = problem
    return { problem }
  }

  const contestId = Number(ctx.request.query.cid)
  if (Number.isInteger(contestId) && contestId > 0) {
    const contest = await Contest.findOne({ cid: contestId })
    const session = ctx.session.profile
    if (
      contest
      && contest.list.includes(problemId)
      && contest.start <= Date.now()
      && (
        contest.encrypt === encrypt.Public
        || session?.verifyContest?.includes(contest.cid)
      )
    ) {
      if (session && !session.verifyContest) {
        session.verifyContest = []
      }
      if (session?.verifyContest && !session.verifyContest.includes(contest.cid)) {
        session.verifyContest.push(contest.cid)
      }

      ctx.state.problem = problem
      return { problem }
    }
  }

  return ctx.throw(...ERR_PERM_DENIED)
}

/**
 * 查询题目列表
 */
const findProblems = async (ctx: Context) => {
  const opt = ctx.request.query
  const { profile } = ctx.state

  /** @todo [ TO BE DEPRECATED ] 要有专门的 Endpoint 来获取所有题目 */
  if (Number(opt.page) === -1 && profile?.isAdmin) {
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

  const { page, pageSize } = parsePaginateOption(opt, 30, 100)

  const filters = []
  if (!profile?.isAdmin) {
    filters.push({ status: status.Available })
  }

  if (opt.content) {
    if (opt.type === 'title') {
      filters.push({
        title: {
          $regex: new RegExp(escapeRegExp(String(opt.content)), 'i'),
        },
      })
    } else if (opt.type === 'tag') {
      filters.push({
        tags: {
          $in: [ new RegExp(escapeRegExp(String(opt.content)), 'i') ],
        },
      })
    } else if (opt.type === 'pid') {
      filters.push({
        $expr: {
          $regexMatch: {
            input: { $toString: '$pid' },
            regex: new RegExp(`^${escapeRegExp(String(opt.content))}`, 'i'),
          },
        },
      })
    }
  }

  if (opt.course) {
    const { course } = await loadCourse(ctx)
    filters.push({ course: course.id })
  } else if (!profile?.isAdmin) {
    filters.push({
      $or: [
        { course: { $exists: false } },
        { course: null },
      ],
    })
  }

  const list = await Problem.paginate({ $and: filters }, {
    sort: { pid: 1 },
    page,
    limit: pageSize,
    lean: true,
    leanWithId: false,
    select: '-_id pid title status type tags submit solve',
  }) as any as Paginated<ProblemDocument>

  let solved = []
  if (profile && list.total > 0) {
    solved = await Solution
      .find({
        uid: profile.uid,
        judge: judge.Accepted,
        pid: { $in: list.docs.map(p => p.pid) },
      })
      .distinct('pid')
      .lean()
      .exec()
  }

  ctx.body = { list, solved }
}

// 返回一道题目
const getProblem = async (ctx: Context) => {
  const { problem } = await loadProblem(ctx)
  const { profile } = ctx.state

  ctx.body = {
    problem: {
      pid: problem.pid,
      title: problem.title,
      time: problem.time,
      memory: problem.memory,
      status: problem.status,
      type: problem.type,
      tags: problem.tags,
      description: problem.description,
      input: problem.input,
      output: problem.output,
      in: problem.in,
      out: problem.out,
      hint: problem.hint,
      code: profile?.isAdmin ? problem.code : undefined,
    },
  }
}

// 新建一个题目
const createProblem = async (ctx: Context) => {
  const opt = ctx.request.body
  const { profile } = await loadProfile(ctx)

  const problem = new Problem({
    title: opt.title,
    description: opt.description,
    input: opt.input,
    output: opt.output,
    in: opt.in,
    out: opt.out,
    hint: opt.hint,
    type: opt.type,
    code: opt.code,
    time: Number.parseInt(opt.time) || 1000,
    memory: Number.parseInt(opt.memory) || 32768,
  })

  try {
    await problem.save()
    logger.info(`Problem <${problem.pid}> is created by user <${profile.uid}>`)
  } catch (e: any) {
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
const updateProblem = async (ctx: Context) => {
  const opt = ctx.request.body
  const { problem } = await loadProblem(ctx)
  const { profile } = await loadProfile(ctx)

  if (opt.title) { problem.title = opt.title }
  if (opt.time && Number.isInteger(Number(opt.time))) {
    problem.time = Number.parseInt(opt.time)
  }
  if (opt.memory && Number.isInteger(Number(opt.memory))) {
    problem.memory = Number.parseInt(opt.memory)
  }
  if (opt.description) { problem.description = opt.description }
  if (opt.input) { problem.input = opt.input }
  if (opt.output) { problem.output = opt.output }
  if (opt.in) { problem.in = opt.in }
  if (opt.out) { problem.out = opt.out }
  if (opt.hint) { problem.hint = opt.hint }
  if (opt.status) { problem.status = Number(opt.status) }
  if (opt.type) { problem.type = Number(opt.type) }
  if (opt.code) { problem.code = opt.code }

  try {
    await problem.save()
    logger.info(`Problem <${problem.pid}> is updated by user <${profile.uid}>`)
  } catch (e: any) {
    ctx.throw(400, e.message)
  }

  ctx.body = {
    success: true,
    pid: problem.pid,
  }
}

// 删除一道题目
const removeProblem = async (ctx: Context) => {
  const pid = ctx.params.pid
  const { profile } = await loadProfile(ctx)

  try {
    await Problem.deleteOne({ pid }).exec()
    logger.info(`Problem <${pid}> is deleted by user <${profile.uid}>`)
  } catch (e: any) {
    ctx.throw(400, e.message)
  }

  ctx.body = {}
}

const problemController = {
  loadProblem,
  findProblems,
  getProblem,
  createProblem,
  updateProblem,
  removeProblem,
}

export default module.exports = problemController
