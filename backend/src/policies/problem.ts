import type { Context } from 'koa'
import type { Types } from 'mongoose'
import type { ProblemDocumentPopulated } from '../models/Problem'
import { loadContestState } from '../policies/contest'
import courseService from '../services/course'
import problemService from '../services/problem'
import constants from '../utils/constants'
import { ERR_NOT_FOUND } from '../utils/error'

const { status } = constants

export interface ProblemState {
  problem: ProblemDocumentPopulated
}

function buildProblemState (ctx: Context, problem: ProblemDocumentPopulated) {
  const state: ProblemState = { problem }

  ctx.state.problem = state
  return state
}

export async function loadProblemState (ctx: Context, inputId?: string | number, fromContestId?: number): Promise<ProblemState | null> {
  const problemId = Number(inputId ?? ctx.params.pid ?? ctx.request.query.pid)
  if (!Number.isInteger(problemId) || problemId <= 0) {
    return null
  }
  if (ctx.state.problem?.problem.pid === problemId) {
    return ctx.state.problem
  }

  const problem = await problemService.getProblem(problemId)
  if (!problem) {
    return null
  }

  if (problem.status === status.Available) {
    return buildProblemState(ctx, problem)
  }

  const { profile } = ctx.state
  if (profile && profile.isAdmin) {
    return buildProblemState(ctx, problem)
  }

  const contestId = Number(fromContestId ?? ctx.request.query.cid)
  if (Number.isInteger(contestId) && contestId > 0) {
    const contestState = await loadContestState(ctx, contestId)
    if (contestState && contestState.accessible) {
      const { contest } = contestState
      if (contest.problems.some((p: Types.ObjectId) => p.equals(problem._id))) {
        return buildProblemState(ctx, problem)
      }
    }
  }

  if (profile && problem.owner && problem.owner.equals(profile._id)) {
    return buildProblemState(ctx, problem)
  }

  /**
   * @todo If a non-public problem is added to a public course, any users gain access to it
   * through this course. However, since users viewing public courses are not recorded as members,
   * this role relationship cannot be found by this function.
   */
  if (profile && await courseService.hasProblemRole(profile._id, problem._id, 'basic')) {
    return buildProblemState(ctx, problem)
  }

  return null
}

/**
 * @deprecated Controller should handle error throwing
 */
export async function loadProblemOrThrow (ctx: Context, inputId?: string | number, fromContestId?: number) {
  const problemState = await loadProblemState(ctx, inputId, fromContestId)
  if (!problemState) {
    ctx.throw(...ERR_NOT_FOUND)
  }
  return problemState.problem
}
