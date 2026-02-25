import type { ContestModel } from '@putongoj/shared'
import type { Context } from 'koa'
import type { WithId } from 'src/types'
import { ParticipationStatus } from '@putongoj/shared'
import { loadProfile } from '../middlewares/authn'
import Contest from '../models/Contest'
import { loadCourseRoleById } from '../policies/course'
import { contestService } from '../services/contest'
import { isIpInWhitelist } from '../utils'

export interface ContestState {
  contest: WithId<ContestModel>
  accessible: boolean
  participation: ParticipationStatus
  isJury: boolean
  isIpBlocked: boolean
}

export async function loadContestState (ctx: Context, inputId?: number | string) {
  const contestId = Number(inputId ?? ctx.params.contestId)
  if (!Number.isInteger(contestId) || contestId <= 0) {
    return null
  }
  if (ctx.state.contest?.contest.contestId === contestId) {
    return ctx.state.contest
  }

  const contest = await Contest.findOne({ contestId }).lean() as WithId<ContestModel> | null
  if (!contest) {
    return null
  }

  const profile = await loadProfile(ctx)
  const participation = await contestService.getParticipation(profile._id, contest._id)

  let isJury: boolean = false
  if (profile.isAdmin) {
    isJury = true
  }
  if (contest.course && !isJury) {
    const role = await loadCourseRoleById(ctx, contest.course)
    if (!role || !role.basic) {
      return null
    }
    if (role.manageContest) {
      isJury = true
    }
  }

  const isIpBlocked = (contest.ipWhitelistEnabled && !isJury)
    ? !isIpInWhitelist(ctx.state.clientIp, contest.ipWhitelist ?? [])
    : false

  // whether accessible to the contents of the contest
  const accessible = (participation === ParticipationStatus.Approved || isJury) && !isIpBlocked
  const state: ContestState = { contest, participation, isJury, accessible, isIpBlocked }

  ctx.state.contest = state
  return state
}

export async function loadContest (ctx: Context, inputId?: number | string) {
  const state = await loadContestState(ctx, inputId)
  return state?.contest ?? null
}
