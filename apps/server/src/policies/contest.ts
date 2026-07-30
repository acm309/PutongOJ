import type { ParticipationStatus } from '@putongoj/db'
import type { Context } from 'koa'
import { ParticipationStatus as ParticipationStatusEnum } from '@putongoj/shared'
import { isAdmin } from '../auth/user'
import { loadProfile } from '../middlewares/authn'
import { contestService } from '../services/contest'
import { isIpInWhitelist } from '../utils'
import { loadCourseRoleById } from './course'

export interface ContestState {
  contest: NonNullable<Awaited<ReturnType<typeof contestService.getContest>>>
  accessible: boolean
  participation: ParticipationStatus
  isJury: boolean
  isIpBlocked: boolean
  hasStarted: boolean
  hasEnded: boolean
}

export async function loadContestState (ctx: Context, inputId?: number | string): Promise<ContestState | null> {
  const contestId = Number(inputId ?? ctx.params.contestId)
  if (!Number.isInteger(contestId) || contestId <= 0) { return null }
  if (ctx.state.contest?.contest.id === contestId) { return ctx.state.contest }
  const contest = await contestService.getContest(contestId)
  if (!contest) { return null }
  const profile = await loadProfile(ctx)
  const participation = await contestService.getParticipation(profile.id, contest.id)
  const courseRole = await loadCourseRoleById(ctx, contest.courseId)
  const isJury = isAdmin(profile) || courseRole?.canManageContests === true
  const isIpBlocked = contest.ipWhitelistEnabled && !isJury
    ? !isIpInWhitelist(ctx.state.clientIp, contest.ipWhitelist)
    : false
  const now = new Date()
  const hasStarted = contest.startsAt <= now
  const hasEnded = contest.endsAt < now
  const qualified = participation === ParticipationStatusEnum.APPROVED || isJury
  const state: ContestState = {
    contest,
    participation,
    isJury,
    isIpBlocked,
    hasStarted,
    hasEnded,
    accessible: qualified && !isIpBlocked && (hasStarted || isJury),
  }
  ctx.state.contest = state
  return state
}

export async function loadContest (ctx: Context, inputId?: number | string) {
  return (await loadContestState(ctx, inputId))?.contest ?? null
}
