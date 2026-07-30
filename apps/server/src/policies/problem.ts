import type { Context } from 'koa'
import { ProblemVisibility } from '@putongoj/shared'
import courseService from '../services/course'
import problemService from '../services/problem'
import { loadContestState } from './contest'

export interface ProblemState {
  problem: NonNullable<Awaited<ReturnType<typeof problemService.getProblem>>>
}

export async function loadProblemState (ctx: Context, inputId?: string | number, fromContestId?: number): Promise<ProblemState | null> {
  const problemId = Number(inputId ?? ctx.params.problemId ?? ctx.request.query.problemId)
  if (!Number.isInteger(problemId) || problemId <= 0) { return null }
  if (ctx.state.problem?.problem.id === problemId) { return ctx.state.problem }
  const problem = await problemService.getProblem(problemId)
  if (!problem) { return null }
  const profile = ctx.state.profile
  if (problem.visibility === ProblemVisibility.AVAILABLE || profile?.isAdmin || problem.ownerId === profile?.id) {
    const state = { problem }
    ctx.state.problem = state
    return state
  }
  const contestId = Number(fromContestId ?? ctx.request.query.contestId)
  if (Number.isInteger(contestId) && contestId > 0) {
    const contestState = await loadContestState(ctx, contestId)
    if (contestState?.accessible && contestState.contest.problems.some(item => item.problemId === problem.id)) {
      const state = { problem }
      ctx.state.problem = state
      return state
    }
  }
  if (profile && await courseService.hasProblemRole(profile.id, problem.id, 'canAccess')) {
    const state = { problem }
    ctx.state.problem = state
    return state
  }
  return null
}

export async function loadProblemOrThrow (ctx: Context, inputId?: number | string) {
  const state = await loadProblemState(ctx, inputId)
  if (!state) { ctx.throw(404, 'Problem not found') }
  return state.problem
}
