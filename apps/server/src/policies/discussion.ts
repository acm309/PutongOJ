import type { Context } from 'koa'
import { DiscussionType } from '@putongoj/shared'
import discussionService from '../services/discussion'
import { loadContest } from './contest'
import { loadCourseRoleById } from './course'

export interface DiscussionState {
  discussion: NonNullable<Awaited<ReturnType<typeof discussionService.getDiscussion>>>
  isJury: boolean
}

export const publicDiscussionTypes = [
  DiscussionType.OPEN_DISCUSSION,
  DiscussionType.PUBLIC_ANNOUNCEMENT,
] as const

export async function loadDiscussion (ctx: Context, inputId?: number | string) {
  const discussionId = Number(inputId ?? ctx.params.discussionId)
  if (!Number.isInteger(discussionId) || discussionId <= 0) { return null }
  if (ctx.state.discussion?.discussion.id === discussionId) { return ctx.state.discussion }
  const discussion = await discussionService.getDiscussion(discussionId)
  if (!discussion) { return null }
  const profile = ctx.state.profile
  const contest = discussion.contestId === null ? null : await loadContest(ctx, discussion.contestId)
  const courseRole = await loadCourseRoleById(ctx, contest?.courseId ?? null)
  const isAuthor = profile !== undefined && profile.id === discussion.authorId
  const isProblemOwner = profile !== undefined && discussion.problem !== null && profile.id === discussion.problem.ownerId
  const isJury = profile?.isAdmin === true || isProblemOwner || courseRole?.canManageContests === true
  const canRead = (
    discussion.type === DiscussionType.OPEN_DISCUSSION
    || discussion.type === DiscussionType.PUBLIC_ANNOUNCEMENT
  ) || isJury || isAuthor
  if (!canRead) { return null }
  const state: DiscussionState = { discussion, isJury }
  ctx.state.discussion = state
  return state
}
