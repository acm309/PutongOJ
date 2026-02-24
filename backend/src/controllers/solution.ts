import type { Context } from 'koa'
import type { CourseDocument } from '../models/Course'
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
import { loadCourseStateOrThrow } from '../policies/course'
import { createEnvelopedResponse, createErrorResponse } from '../utils'
import { judgeResult } from '../utils/constants'

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
      const contest = await Contest
        .findOne({ contestId: solution.mid }, 'course')
        .populate<{ course: CourseDocument }>('course')
      if (contest && contest.course) {
        const { role } = await loadCourseStateOrThrow(ctx, contest.course.courseId)
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
  const problem = await Problem.findOne({ pid })
  if (!problem) {
    ctx.throw(400, 'No such a problem')
  }
  if (mid > 0) {
    const contest = await Contest.findOne({ contestId: mid }).populate('course')
    if (!contest) {
      ctx.throw(400, 'No such a contest')
    }
    const now = new Date()
    if (contest.endsAt < now) {
      ctx.throw(400, 'Contest is ended!')
    }
    if (!contest.problems.includes(problem._id)) {
      ctx.throw(400, 'No such a problem in the contest')
    }
    if (contest.course) {
      course = contest.course._id
    }
  }

  /**
   * @TODO
   */
  // if (problem.course && !course) {
  //   course = problem.course._id
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

    await redis.rpush('judger:task', JSON.stringify(submission))
    ctx.auditLog.info(`<Submission:${sid}> of <Problem:${pid}>${mid > 0 ? ` in <Contest:${mid}>` : ''} created by <User:${uid}>`)

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
    return createErrorResponse(ctx, ErrorCode.BadRequest, 'Invalid submission id')
  }
  const updatedJudge = Number(opt.judge)
  if (updatedJudge !== judgeResult.RejudgePending && updatedJudge !== judgeResult.Skipped) {
    return createErrorResponse(ctx, ErrorCode.BadRequest, 'Invalid judge status, only support RejudgePending and Skipped')
  }

  const solution = await Solution.findOne({ sid })
  if (!solution) {
    return createErrorResponse(ctx, ErrorCode.NotFound)
  }
  const pid = solution.pid
  const problem = await Problem.findOne({ pid })
  if (!problem) {
    return createErrorResponse(ctx, ErrorCode.NotFound, 'Problem of the solution not found')
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
  } catch (err) {
    ctx.auditLog.error('Failed to update solution', err)
    return createErrorResponse(ctx, ErrorCode.InternalServerError)
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

    await redis.rpush('judger:task', JSON.stringify(submission))
    ctx.auditLog.info(`<Submission:${sid}> rejudged by <User:${profile.uid}>`)
  } catch (err) {
    ctx.auditLog.error('Failed to push solution to judger queue', err)
    return createErrorResponse(ctx, ErrorCode.InternalServerError)
  }

  return createEnvelopedResponse(ctx, solution)
}

const solutionController = {
  findOne,
  create,
  updateSolution,
} as const

export default solutionController
