import type { Context } from 'koa'
import type { Types } from 'mongoose'
import type { CourseDocument } from '../models/Course'
import type { ProblemState } from '../policies/problem'
import { Buffer } from 'node:buffer'
import path from 'node:path'
import { ErrorCode, JudgeStatus } from '@putongoj/shared'
import fse from 'fs-extra'
import { pick } from 'lodash'
import redis from '../config/redis'
import { loadProfile } from '../middlewares/authn'
import Contest from '../models/Contest'
import Problem from '../models/Problem'
import Solution from '../models/Solution'
import { loadContestState } from '../policies/contest'
import { loadCourseStateOrThrow } from '../policies/course'
import { loadProblemState } from '../policies/problem'
import { createEnvelopedResponse, createErrorResponse } from '../utils'

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

  let problemState: ProblemState | null = null
  if (mid > 0) {
    const contestState = await loadContestState(ctx, mid)
    if (!contestState) {
      ctx.throw(400, 'No such a contest')
    }
    const { contest, accessible, isIpBlocked, isJury } = contestState

    if (isIpBlocked) {
      ctx.throw(403, 'Your IP address is not in the whitelist for this contest')
    }
    if (!accessible) {
      ctx.throw(403, 'Permission denied')
    }

    const now = new Date()
    if (!isJury && contest.startsAt > now) {
      ctx.throw(400, 'Contest is not started yet!')
    }
    if (!isJury && contest.endsAt < now) {
      ctx.throw(400, 'Contest is ended!')
    }

    problemState = await loadProblemState(ctx, pid, contest.contestId)
    if (!problemState) {
      ctx.throw(404, 'Problem not found or access denied')
    }
    const contestProblem = problemState.problem
    if (!contest.problems.some((problemId: Types.ObjectId) => problemId.equals(contestProblem._id))) {
      ctx.throw(400, 'No such a problem in the contest')
    }
  } else {
    problemState = await loadProblemState(ctx, pid)
    if (!problemState) {
      ctx.throw(404, 'Problem not found or access denied')
    }
  }

  const { problem } = problemState

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
      pid, mid, uid, code, language,
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
  if (updatedJudge !== JudgeStatus.RejudgePending && updatedJudge !== JudgeStatus.Skipped) {
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

  if (updatedJudge !== JudgeStatus.RejudgePending) {
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
