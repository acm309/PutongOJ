import type { Context } from 'koa'
import { Buffer } from 'node:buffer'
import path from 'node:path'
import { ErrorCode } from '@putongoj/shared'
import fse from 'fs-extra'
import { pick } from 'lodash'
import redis from '../config/redis'
import { loadProfile } from '../middlewares/authn'
import Contest from '../models/Contest'
import Problem from '../models/Problem'
import Solution from '../models/Solution'
import { createEnvelopedResponse, createErrorResponse } from '../utils'
import { judgeResult } from '../utils/constants'
import logger from '../utils/logger'
import { loadCourse } from './course'

export async function findOne (ctx: Context) {
  const opt = Number.parseInt(ctx.params.sid, 10)
  if (!Number.isInteger(opt) || opt <= 0) {
    ctx.throw(400, 'Invalid submission id')
  }

  const solution = await Solution.findOne({ sid: opt }).lean()
  if (!solution) {
    ctx.throw(400, 'No such a solution')
  }

  const profile = await loadProfile(ctx)
  const hasPermission = await (async () => {
    if (solution.uid === profile.uid) {
      return true
    }
    if (profile.isAdmin) {
      return true
    }
    if (solution.mid > 0) {
      const contest = await Contest.findOne({ cid: solution.mid }, 'course').populate('course')
      if (contest && contest.course) {
        const { role } = await loadCourse(ctx, contest.course)
        if (role.viewSolution) {
          return true
        }
      }
    }
    return false
  })()
  if (!hasPermission) {
    ctx.throw(403, 'Permission denied')
  }

  // 如果是 admin 请求，并且有 sim 值(有抄袭嫌隙)，那么也样将可能被抄袭的提交也返回
  let simSolution
  if (profile.isAdmin && solution.sim) {
    simSolution = await Solution.findOne({ sid: solution.sim_s_id }).lean().exec()
  }

  ctx.body = {
    solution: {
      ...pick(solution, [ 'sid', 'pid', 'uid', 'mid', 'course', 'code', 'language',
        'create', 'status', 'judge', 'time', 'memory', 'error', 'sim', 'sim_s_id', 'testcases' ]),
      simSolution: simSolution
        ? pick(simSolution, [ 'sid', 'uid', 'code', 'create' ])
        : undefined,
    },
  }
}

/**
 * 创建一个提交
 */
const create = async (ctx: Context) => {
  const profile = await loadProfile(ctx)
  const opt = ctx.request.body
  const required = [ 'pid', 'code', 'language' ]
  for (const key of required) {
    if (!opt[key]) {
      ctx.throw(400, `Missing parameter: ${key}`)
    }
  }

  const uid = profile.uid
  const pid = Number.parseInt(opt.pid)
  const code = String(opt.code)
  const language = Number.parseInt(opt.language)
  const mid = Number.parseInt(opt.mid) || -1

  if (language < 0 || language > 6) {
    ctx.throw(400, 'Invalid language')
  }
  if (code.length < 8 || code.length > 16384) {
    ctx.throw(400, 'Code length should between 8 and 16384')
  }

  let course = null
  if (mid > 0) {
    const mid = Number.parseInt(opt.mid)
    const contest = await Contest.findOne({ cid: mid }).populate('course')
    if (!contest) {
      ctx.throw(400, 'No such a contest')
    }
    if (contest.end < Date.now()) {
      ctx.throw(400, 'Contest is ended!')
    }
    if (!contest.list.includes(pid)) {
      ctx.throw(400, 'No such a problem in the contest')
    }
    if (contest.course) {
      course = contest.course.id
    }
  }
  const problem = await Problem.findOne({ pid })
  if (!problem) {
    ctx.throw(400, 'No such a problem')
  }
  /**
   * @TODO
   */
  // if (problem.course && !course) {
  //   course = problem.course.id
  // }

  try {
    const timeLimit = problem.time
    const memoryLimit = problem.memory
    const type = problem.type
    const additionCode = problem.code

    let meta = { testcases: [] }
    const dir = path.resolve(__dirname, `../../data/${pid}`)
    const file = path.resolve(dir, 'meta.json')
    if (fse.existsSync(file)) {
      meta = await fse.readJson(file)
    }
    const testcases = meta.testcases.map((item: { uuid: string }) => {
      return {
        uuid: item.uuid,
        input: { src: `/app/data/${pid}/${item.uuid}.in` },
        output: { src: `/app/data/${pid}/${item.uuid}.out` },
      }
    })

    const solution = new Solution({
      pid, mid, uid, code, language, course,
      length: Buffer.from(code).length, // 这个属性是不是没啥用？
    })

    await solution.save()

    const sid = solution.sid
    const submission = {
      sid, timeLimit, memoryLimit,
      testcases, language, code,
      type, additionCode,
    }

    redis.rpush('judger:task', JSON.stringify(submission))
    logger.info(`Submission <${sid}> is created by user <${uid}>`)

    ctx.body = { sid }
  } catch (e: any) {
    ctx.throw(400, e.message)
  }
}

async function updateSolution (ctx: Context) {
  const profile = await loadProfile(ctx)
  const opt = ctx.request.body

  const sid = Number(ctx.params.sid)
  if (!Number.isInteger(sid) || sid <= 0) {
    return createErrorResponse(ctx,
      'Invalid submission id',
      ErrorCode.BadRequest,
    )
  }
  const updatedJudge = Number(opt.judge)
  if (updatedJudge !== judgeResult.RejudgePending && updatedJudge !== judgeResult.Skipped) {
    return createErrorResponse(ctx,
      'Invalid judge status, only support RejudgePending and Skipped',
      ErrorCode.BadRequest,
    )
  }

  const solution = await Solution.findOne({ sid })
  if (!solution) {
    return createErrorResponse(ctx,
      'Solution not found',
      ErrorCode.NotFound,
    )
  }
  const pid = solution.pid
  const problem = await Problem.findOne({ pid })
  if (!problem) {
    return createErrorResponse(ctx,
      'Problem of the solution not found',
      ErrorCode.NotFound,
    )
  }

  try {
    solution.judge = updatedJudge
    solution.time = 0
    solution.memory = 0
    solution.error = ''
    solution.sim = 0
    solution.sim_s_id = 0
    solution.testcases = []

    await solution.save()
  } catch (e: any) {
    return createErrorResponse(ctx,
      e.message || 'Failed to update the solution',
      ErrorCode.InternalServerError,
    )
  }

  if (updatedJudge !== judgeResult.RejudgePending) {
    return createEnvelopedResponse(ctx, solution)
  }

  try {
    const timeLimit = problem.time
    const memoryLimit = problem.memory
    const type = problem.type
    const additionCode = problem.code

    let meta = { testcases: [] }
    const dir = path.resolve(__dirname, `../../data/${pid}`)
    const file = path.resolve(dir, 'meta.json')
    if (fse.existsSync(file)) {
      meta = await fse.readJson(file)
    }
    const testcases = meta.testcases.map((item: { uuid: string }) => {
      return {
        uuid: item.uuid,
        input: { src: `/app/data/${pid}/${item.uuid}.in` },
        output: { src: `/app/data/${pid}/${item.uuid}.out` },
      }
    })
    const submission = {
      sid, timeLimit, memoryLimit, testcases,
      language: solution.language,
      code: solution.code,
      type, additionCode,
    }

    redis.rpush('judger:task', JSON.stringify(submission))
    logger.info(`Submission <${sid}> is called for rejudge by user <${profile.uid}>`)
  } catch (e: any) {
    return createErrorResponse(ctx,
      e.message || 'Failed to push the solution to judger queue',
      ErrorCode.InternalServerError,
    )
  }

  return createEnvelopedResponse(ctx, solution)
}

const solutionController = {
  findOne,
  create,
  updateSolution,
} as const

export default solutionController
