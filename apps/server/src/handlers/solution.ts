import type { CourseDocument, Types } from '@putong-oj/db'
import type { ContestModel, SolutionEntity, UserModel, WithId } from '@putong-oj/shared'
import type { Context } from 'koa'
import type { ProblemState } from '../policies/problem.ts'
import { Buffer } from 'node:buffer'
import Router from '@koa/router'
import { Contest, Problem, Solution } from '@putong-oj/db'
import {
  ErrorCode,
  JudgeStatus,
  SolutionDetailQueryResultSchema,
  SolutionStatusUpdatePayloadSchema,
  SolutionSubmitPayloadSchema,
  SolutionSubmitResultSchema,
  SolutionUpdateQueryResultSchema,
} from '@putong-oj/shared'
import redis from '../config/redis.ts'
import { loadProfile, loginRequire, rootRequire } from '../middlewares/authn.ts'
import { solutionCreateLimit } from '../middlewares/ratelimit.ts'
import { loadContestState } from '../policies/contest.ts'
import { loadCourseStateOrThrow } from '../policies/course.ts'
import { loadProblemState } from '../policies/problem.ts'
import { createEnvelopedResponse, createErrorResponse, createZodErrorResponse } from '../utils/index.ts'

export async function findOne (ctx: Context) {
  const opt = Number.parseInt(ctx.params.sid, 10)
  if (!Number.isInteger(opt) || opt <= 0) {
    ctx.throw(400, 'Invalid submission id')
  }

  const solution = await Solution
    .findOne({ sid: opt })
    .populate<{
    contest: WithId<Pick<ContestModel, 'contestId'>> | null
    user: WithId<Pick<UserModel, 'uid'>>
    similarSolution: (
        WithId<Pick<SolutionEntity, 'sid' | 'code' | 'create'>>
        & { user: WithId<Pick<UserModel, 'uid'>> }
      ) | null
  }>([
      { path: 'contest', select: 'contestId' },
      { path: 'user', select: 'uid' },
      {
        path: 'similarSolution',
        select: 'sid user code create',
        populate: { path: 'user', select: 'uid' },
      },
    ])
    .lean()
  if (!solution) {
    ctx.throw(400, 'No such a solution')
  }

  const profile = await loadProfile(ctx)
  const hasPermission = await (async () => {
    if (solution.user._id.equals(profile._id)) {
      return true
    }
    if (profile.isAdmin) {
      return true
    }
    if (solution.contest) {
      const contest = await Contest
        .findById(solution.contest._id, 'course')
        .populate<{ course: CourseDocument }>('course')
      if (contest && contest.course) {
        const { role } = await loadCourseStateOrThrow(ctx, contest.course.id)
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

  const result = SolutionDetailQueryResultSchema.encode({
    ...solution,
    status: solution.status as 0 | 2,
    course: solution.course ? solution.course.toString() : null,
    contest: solution.contest,
    simSolution: profile.isAdmin && solution.similarity
      ? solution.similarSolution ?? undefined
      : undefined,
  })
  return createEnvelopedResponse(ctx, result)
}

/**
 * 创建一个提交
 */
async function create (ctx: Context) {
  const profile = await loadProfile(ctx)
  const payload = SolutionSubmitPayloadSchema.safeParse(ctx.request.body)
  if (!payload.success) {
    return createZodErrorResponse(ctx, payload.error)
  }

  const uid = profile.uid
  const pid = payload.data.problem
  const code = payload.data.code
  const language = payload.data.language
  const contestId = payload.data.contest
  let contest: Types.ObjectId | null = null

  let problemState: ProblemState | null = null
  if (contestId !== undefined) {
    const contestState = await loadContestState(ctx, contestId)
    if (!contestState) {
      ctx.throw(400, 'No such a contest')
    }
    const { contest: contestDoc, accessible, isIpBlocked, isJury } = contestState

    if (isIpBlocked) {
      ctx.throw(403, 'Your IP address is not in the whitelist for this contest')
    }
    if (!accessible) {
      ctx.throw(403, 'Permission denied')
    }

    const now = new Date()
    if (!isJury && contestDoc.startsAt > now) {
      ctx.throw(400, 'Contest is not started yet!')
    }
    if (!isJury && contestDoc.endsAt < now) {
      ctx.throw(400, 'Contest is ended!')
    }

    problemState = await loadProblemState(ctx, pid, contestDoc.contestId)
    if (!problemState) {
      ctx.throw(404, 'Problem not found or access denied')
    }
    const contestProblem = problemState.problem
    if (!contestDoc.problems.some((problemId: Types.ObjectId) => problemId.equals(contestProblem._id))) {
      ctx.throw(400, 'No such a problem in the contest')
    }
    if (contestDoc.allowedLanguages && !contestDoc.allowedLanguages.includes(language)) {
      ctx.throw(400, 'This language is not allowed in the contest')
    }
    contest = contestDoc._id
  } else {
    problemState = await loadProblemState(ctx, pid)
    if (!problemState) {
      ctx.throw(404, 'Problem not found or access denied')
    }
  }

  try {
    const solution = new Solution({
      pid, contest, user: profile._id, code, language,
      length: Buffer.from(code).length, // 这个属性是不是没啥用？
    })

    await solution.save()

    const sid = solution.sid
    await redis.rpush('judger:task', solution._id.toString())
    ctx.auditLog.info(`<Submission:${sid}> of <Problem:${pid}>${contestId ? ` in <Contest:${contestId}>` : ''} created by <User:${uid}>`)

    const result = SolutionSubmitResultSchema.encode({ sid })
    return createEnvelopedResponse(ctx, result)
  } catch (e: any) {
    ctx.throw(400, e.message)
  }
}

async function updateSolution (ctx: Context) {
  const profile = await loadProfile(ctx)
  const payload = SolutionStatusUpdatePayloadSchema.safeParse(ctx.request.body)
  if (!payload.success) {
    return createZodErrorResponse(ctx, payload.error)
  }

  const sid = Number(ctx.params.sid)
  if (!Number.isInteger(sid) || sid <= 0) {
    return createErrorResponse(ctx, ErrorCode.BadRequest, 'Invalid submission id')
  }
  const updatedJudge = payload.data.judge

  const solution = await Solution.findOne({ sid })
  if (!solution) {
    return createErrorResponse(ctx, ErrorCode.NotFound)
  }
  const pid = solution.pid
  if (!await Problem.exists({ pid })) {
    return createErrorResponse(ctx, ErrorCode.NotFound, 'Problem of the solution not found')
  }

  let contest: Pick<ContestModel, 'contestId'> | null = null
  let solutionUser: WithId<Pick<UserModel, 'uid'>>
  try {
    solution.judge = updatedJudge
    solution.time = 0
    solution.memory = 0
    solution.error = ''
    solution.similarity = 0
    solution.similarSolution = null
    solution.testcases = []

    await solution.save()
    await solution.populate<{ user: WithId<Pick<UserModel, 'uid'>> }>('user', 'uid')
    solutionUser = solution.user as unknown as WithId<Pick<UserModel, 'uid'>>
    contest = solution.contest
      ? await Contest.findById(solution.contest, 'contestId').lean()
      : null
  } catch (err) {
    ctx.auditLog.error('Failed to update solution', err)
    return createErrorResponse(ctx, ErrorCode.InternalServerError)
  }

  if (updatedJudge !== JudgeStatus.RejudgePending) {
    const result = SolutionUpdateQueryResultSchema.encode({
      ...solution.toObject(),
      user: solutionUser,
      course: solution.course ? solution.course.toString() : null,
      contest,
      status: solution.status as 0 | 2,
      testcases: solution.testcases,
    })
    return createEnvelopedResponse(ctx, result)
  }

  try {
    await redis.rpush('judger:task', solution._id.toString())
    ctx.auditLog.info(`<Submission:${sid}> rejudged by <User:${profile.uid}>`)
  } catch (err) {
    ctx.auditLog.error('Failed to push solution to judger queue', err)
    return createErrorResponse(ctx, ErrorCode.InternalServerError)
  }

  const result = SolutionUpdateQueryResultSchema.encode({
    ...solution.toObject(),
    user: solutionUser,
    course: solution.course ? solution.course.toString() : null,
    contest,
    status: solution.status as 0 | 2,
    testcases: solution.testcases,
  })
  return createEnvelopedResponse(ctx, result)
}

function registerSolutionHandlers (router: Router) {
  const solutionRouter = new Router({ prefix: '/status' })

  solutionRouter.get('/:sid', loginRequire, findOne)
  solutionRouter.put('/:sid', rootRequire, updateSolution)
  solutionRouter.post('/', loginRequire, solutionCreateLimit, create)

  router.use(solutionRouter.routes(), solutionRouter.allowedMethods())
}

export default registerSolutionHandlers
