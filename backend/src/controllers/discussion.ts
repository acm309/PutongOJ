import type { Context } from 'koa'
import {
  DiscussionDetailQueryResultSchema,
  DiscussionListQueryResultSchema,
  DiscussionListQuerySchema,
  DiscussionType,
  ErrorCode,
} from '@putongoj/shared'
import discussionService from '../services/discussion'
import { getUser } from '../services/user'
import {
  createEnvelopedResponse,
  createErrorResponse,
  createZodErrorResponse,
} from '../utils'
import { loadContest } from './contest'
import { loadCourse } from './course'

const publicTypes = [
  DiscussionType.OpenDiscussion,
  DiscussionType.PublicAnnouncement,
] as DiscussionType[]

export async function loadDiscussion (
  ctx: Context,
  input?: number | string,
) {
  const discussionId = Number(input ?? ctx.params.discussionId)
  if (!Number.isInteger(discussionId) || discussionId <= 0) {
    return null
  }
  if (ctx.state.discussion?.discussionId === discussionId) {
    return ctx.state.discussion
  }

  const discussion = await discussionService.getDiscussion(discussionId)
  if (!discussion) {
    return null
  }
  if (publicTypes.includes(discussion.type)) {
    ctx.state.discussion = discussion
    return discussion
  }

  const { profile } = ctx.state
  const isAdmin = profile?.isAdmin ?? false
  const isDiscussionOwner = discussion.owner._id.equals(profile?._id)
  const isProblemOwner = discussion.problem?.owner?.equals(profile?._id) ?? false
  if (isDiscussionOwner || isAdmin || isProblemOwner) {
    ctx.state.discussion = discussion
    return discussion
  }

  if (discussion.contest) {
    const contest = await loadContest(ctx, discussion.contest.cid)
    if (contest.course) {
      const { role } = await loadCourse(ctx, contest.course)
      if (role.manageContest) {
        ctx.state.discussion = discussion
        return discussion
      }
    }
  }

  return null
}

async function findDiscussions (ctx: Context) {
  const query = DiscussionListQuerySchema.safeParse(ctx.request.query)
  if (!query.success) {
    return createZodErrorResponse(ctx, query.error)
  }

  const { profile } = ctx.state
  const { page, pageSize, sort, sortBy, type, owner } = query.data

  const basicFilter: Parameters<typeof discussionService.findDiscussions>[1] = {
    problem: null,
    contest: null,
  }
  if (type) {
    basicFilter.type = type
  }
  if (owner) {
    const filterOwner = await getUser(owner)
    if (filterOwner) {
      basicFilter.owner = filterOwner._id
    }
  }

  const filters = [ basicFilter ]
  if (!profile?.isAdmin) {
    const visibilityFilters: typeof filters = [
      { type: { $in: publicTypes } },
    ]
    if (profile) {
      visibilityFilters.push({ owner: profile._id })
    }
    filters.push({ $or: visibilityFilters })
  }

  const discussions = await discussionService.findDiscussions(
    { page, pageSize, sort, sortBy },
    { $and: filters },
    [ 'discussionId', 'owner', 'type', 'title', 'createdAt', 'updatedAt' ],
    { owner: [ 'uid' ] },
  )
  const result = DiscussionListQueryResultSchema.encode(discussions)
  return createEnvelopedResponse(ctx, result)
}

async function getDiscussion (ctx: Context) {
  const discussion = await loadDiscussion(ctx)
  if (!discussion) {
    return createErrorResponse(ctx,
      'Discussion not found or access denied', ErrorCode.NotFound,
    )
  }
  const result = DiscussionDetailQueryResultSchema.encode(discussion)
  return createEnvelopedResponse(ctx, result)
}

const discussionController = {
  findDiscussions,
  getDiscussion,
} as const

export default discussionController
