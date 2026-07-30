import type { Context } from 'koa'
import path from 'node:path'
import Router from '@koa/router'
import {
  ErrorCode,
  JudgeStatus,
  SolutionSubmitPayloadSchema,
  SolutionSubmitResultSchema,
  SubmissionDetailQueryResultSchema,
  SubmissionStatusUpdatePayloadSchema,
} from '@putongoj/shared'
import fse from 'fs-extra'
import { isAdmin } from '../auth/user'
import { getDatabase } from '../config/postgres'
import redis from '../config/redis'
import { loadProfile, loginRequire, rootRequire } from '../middlewares/authn'
import { solutionCreateLimit } from '../middlewares/ratelimit'
import { loadContestState } from '../policies/contest'
import { loadCourseRoleById } from '../policies/course'
import { loadProblemState } from '../policies/problem'
import { createEnvelopedResponse, createErrorResponse, createZodErrorResponse } from '../utils'

async function buildJudgeTask (
  problem: { id: number, timeLimitMs: number, memoryLimitKb: number, judgeType: string, judgeCode: string },
  submission: { id: number, language: string, sourceCode: string },
) {
  const file = path.resolve(__dirname, `../../data/${problem.id}/meta.json`)
  const meta = fse.existsSync(file) ? await fse.readJson(file) : { testcases: [] }
  return {
    submissionId: submission.id,
    timeLimit: problem.timeLimitMs,
    memoryLimit: problem.memoryLimitKb,
    testcases: meta.testcases.map((testcase: { uuid: string }) => ({
      uuid: testcase.uuid,
      input: { src: `/app/data/${problem.id}/${testcase.uuid}.in` },
      output: { src: `/app/data/${problem.id}/${testcase.uuid}.out` },
    })),
    language: submission.language,
    code: submission.sourceCode,
    type: problem.judgeType,
    additionCode: problem.judgeCode,
  }
}

export async function findOne (ctx: Context) {
  const id = Number(ctx.params.submissionId)
  if (!Number.isInteger(id) || id <= 0) {
    return createErrorResponse(ctx, ErrorCode.BadRequest, 'Invalid submission id')
  }

  const database = await getDatabase()
  const submission = await database.submission.findUnique({
    where: { id },
    include: {
      user: true,
      similarSubmission: { include: { user: true } },
      testcaseResults: true,
    },
  })
  if (!submission) {
    return createErrorResponse(ctx, ErrorCode.NotFound, 'Submission not found')
  }

  const profile = await loadProfile(ctx)
  const role = await loadCourseRoleById(ctx, submission.courseId)
  if (submission.userId !== profile.id && !isAdmin(profile) && !role?.canViewSubmissions) {
    return createErrorResponse(ctx, ErrorCode.Forbidden, 'Permission denied')
  }

  const similarSubmission = isAdmin(profile) && submission.similarSubmission
    ? {
        id: submission.similarSubmission.id,
        userId: submission.similarSubmission.userId,
        user: {
          id: submission.similarSubmission.user.id,
          username: submission.similarSubmission.user.username,
          nickname: submission.similarSubmission.user.nickname,
        },
        sourceCode: submission.similarSubmission.sourceCode,
        createdAt: submission.similarSubmission.createdAt,
      }
    : null

  return createEnvelopedResponse(ctx, SubmissionDetailQueryResultSchema.encode({
    id: submission.id,
    problemId: submission.problemId,
    contestId: submission.contestId,
    userId: submission.userId,
    user: {
      id: submission.user.id,
      username: submission.user.username,
      nickname: submission.user.nickname,
    },
    language: submission.language,
    status: submission.status,
    timeUsedMs: submission.timeUsedMs,
    memoryUsedKb: submission.memoryUsedKb,
    errorMessage: submission.errorMessage,
    similarity: submission.similarity,
    similarSubmissionId: submission.similarSubmissionId,
    sourceCode: submission.sourceCode,
    testcaseResults: submission.testcaseResults.map(result => ({
      testcaseId: result.testcaseId,
      status: result.status,
      timeUsedMs: result.timeUsedMs,
      memoryUsedKb: result.memoryUsedKb,
    })),
    createdAt: submission.createdAt,
    updatedAt: submission.updatedAt,
    similarSubmission,
  }))
}

async function create (ctx: Context) {
  const payload = SolutionSubmitPayloadSchema.safeParse(ctx.request.body)
  if (!payload.success) { return createZodErrorResponse(ctx, payload.error) }

  const profile = await loadProfile(ctx)
  const contestId = payload.data.contestId ?? null
  const problemState = await loadProblemState(ctx, payload.data.problemId, contestId ?? undefined)
  if (!problemState) { return createErrorResponse(ctx, ErrorCode.NotFound, 'Problem not found or access denied') }

  if (contestId) {
    const contestState = await loadContestState(ctx, contestId)
    if (!contestState?.accessible || contestState.isIpBlocked) {
      return createErrorResponse(ctx, ErrorCode.Forbidden, 'Permission denied')
    }
    if (!contestState.isJury && !contestState.hasStarted) {
      return createErrorResponse(ctx, ErrorCode.BadRequest, 'Contest has not started yet!')
    }
    if (!contestState.isJury && contestState.hasEnded) {
      return createErrorResponse(ctx, ErrorCode.BadRequest, 'Contest is ended!')
    }
    if (!contestState.contest.problems.some(problem => problem.problemId === problemState.problem.id)) {
      return createErrorResponse(ctx, ErrorCode.Forbidden, 'Permission denied')
    }

    const languageAllowed = contestState.contest.allowedLanguages.length === 0
      || contestState.contest.allowedLanguages.includes(payload.data.language)
    if (!languageAllowed) {
      return createErrorResponse(ctx, ErrorCode.BadRequest, 'This language is not allowed in the contest')
    }
  }

  const database = await getDatabase()
  const submission = await database.submission.create({
    data: {
      problemId: problemState.problem.id,
      userId: profile.id,
      contestId,
      courseId: null,
      sourceCode: payload.data.sourceCode,
      language: payload.data.language,
    },
  })
  await redis.rpush('judger:task', JSON.stringify(await buildJudgeTask(problemState.problem, submission)))
  return createEnvelopedResponse(ctx, SolutionSubmitResultSchema.encode({ submissionId: submission.id }))
}

async function updateSolution (ctx: Context) {
  const id = Number(ctx.params.submissionId)
  const payload = SubmissionStatusUpdatePayloadSchema.safeParse(ctx.request.body)
  if (!Number.isInteger(id) || id <= 0 || !payload.success) {
    return createErrorResponse(ctx, ErrorCode.BadRequest)
  }

  const database = await getDatabase()
  const submission = await database.submission.update({
    where: { id },
    data: {
      status: payload.data.status,
      timeUsedMs: 0,
      memoryUsedKb: 0,
      errorMessage: '',
      similarity: 0,
      similarSubmissionId: null,
      testcaseResults: { deleteMany: {} },
    },
    include: { problem: true, user: true },
  })
  if (payload.data.status === JudgeStatus.REJUDGE_PENDING) {
    await redis.rpush('judger:task', JSON.stringify(await buildJudgeTask(submission.problem, submission)))
  }
  return createEnvelopedResponse(ctx, null)
}

export default function registerSolutionHandlers (router: Router) {
  const solutionRouter = new Router({ prefix: '/submissions' })
  solutionRouter.get('/:submissionId', loginRequire, findOne)
  solutionRouter.put('/:submissionId', rootRequire, updateSolution)
  solutionRouter.post('/', loginRequire, solutionCreateLimit, create)
  router.use(solutionRouter.routes(), solutionRouter.allowedMethods())
}
