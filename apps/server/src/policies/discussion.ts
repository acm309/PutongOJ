import type { Context } from 'koa'
import type { DiscussionDocument } from '../services/discussion'
import { DiscussionType } from '@putongoj/shared'
import discussionService from '../services/discussion'
import { loadContest } from './contest'
import { loadCourseRoleById } from './course'

export interface DiscussionState {
  discussion: DiscussionDocument
  isJury: boolean
}

export const publicDiscussionTypes = [
  DiscussionType.OpenDiscussion,
  DiscussionType.PublicAnnouncement,
] as DiscussionType[]

export async function loadDiscussion (ctx: Context, inputId?: number | string) {
  const discussionId = Number(inputId ?? ctx.params.discussionId)
  if (!Number.isInteger(discussionId) || discussionId <= 0) {
    return null
  }
  if (ctx.state.discussion?.discussion.discussionId === discussionId) {
    return ctx.state.discussion
  }

  const discussion = await discussionService.getDiscussion(discussionId)
  if (!discussion) {
    return null
  }

  let isJury: boolean = false
  if (discussion.contest) {
    const contest = await loadContest(ctx, discussion.contest.contestId)
    const role = await loadCourseRoleById(ctx, contest?.course ?? null)
    if (role && role.manageContest) {
      isJury = true
    }
  }

  const { profile } = ctx.state
  const isAdmin = profile?.isAdmin ?? false
  const isAuthor = discussion.author._id.equals(profile?._id)
  const isProblemOwner = discussion.problem?.owner?.equals(profile?._id) ?? false
  if (isAdmin || isAuthor || isProblemOwner) {
    isJury = true
  }

  const isPublic = publicDiscussionTypes.includes(discussion.type)
  if (isPublic || isJury) {
    const state: DiscussionState = { discussion, isJury }

    ctx.state.discussion = state
    return state
  }
  return null
}
