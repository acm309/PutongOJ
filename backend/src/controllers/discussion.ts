import type { Context } from 'koa'
import type { Types } from 'mongoose'
import type { DiscussionQueryFilters } from '../services/discussion'
import {
  CommentCreatePayloadSchema,
  DiscussionCreatePayloadSchema,
  DiscussionDetailQueryResultSchema,
  DiscussionListQueryResultSchema,
  DiscussionListQuerySchema,
  DiscussionType,
  ErrorCode,
} from '@putongoj/shared'
import { loadProfile } from '../middlewares/authn'
import discussionService from '../services/discussion'
import { getUser } from '../services/user'
import {
  createEnvelopedResponse,
  createErrorResponse,
  createZodErrorResponse,
} from '../utils'
import logger from '../utils/logger'
import { loadContest } from './contest'
import { loadCourse } from './course'
import { loadProblem } from './problem'

export const publicDiscussionTypes = [
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

  let isJury: boolean = false
  if (discussion.contest) {
    const contest = await loadContest(ctx, discussion.contest.cid)
    if (contest.course) {
      const { role } = await loadCourse(ctx, contest.course)
      if (role.manageContest) {
        isJury = true
      }
    }
  }

  const { profile } = ctx.state
  const isAdmin = profile?.isAdmin ?? false
  const isAuthor = discussion.author._id.equals(profile?._id)
  const isProblemOwner = discussion.problem?.owner?.equals(profile?._id) ?? false
  if (isAdmin || isAuthor || isProblemOwner) {
    isJury = true
  }

  if (publicDiscussionTypes.includes(discussion.type) || isJury) {
    ctx.state.discussion = discussion
    ctx.state.isDiscussionJury = isJury
    return discussion
  }
  return null
}

async function findDiscussions (ctx: Context) {
  const query = DiscussionListQuerySchema.safeParse(ctx.request.query)
  if (!query.success) {
    return createZodErrorResponse(ctx, query.error)
  }

  const { profile } = ctx.state
  const { page, pageSize, sort, sortBy, type, author } = query.data

  const queryFilter: DiscussionQueryFilters = {}
  if (type) {
    queryFilter.type = type
  }
  if (author) {
    const authorUser = await getUser(author)
    if (authorUser) {
      queryFilter.author = authorUser._id
    }
  }
  const visibilityFilters: DiscussionQueryFilters[] = [ {
    problem: null,
    contest: null,
    type: { $in: publicDiscussionTypes },
  } ]
  if (profile) {
    visibilityFilters.push({ author: profile._id })
  }
  const filters: DiscussionQueryFilters[] = [ queryFilter ]
  if (!(profile?.isAdmin)) {
    filters.push({ $or: visibilityFilters })
  }

  const discussions = await discussionService.findDiscussions(
    { page, pageSize, sort, sortBy },
    { $and: filters },
    [ 'discussionId', 'author', 'problem', 'contest', 'type', 'pinned', 'title', 'createdAt', 'lastCommentAt', 'comments' ],
    { author: [ 'uid', 'avatar' ], problem: [ 'pid' ], contest: [ 'cid' ] },
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

  const { profile, isDiscussionJury } = ctx.state
  const comments = await discussionService.getComments(discussion._id, {
    showHidden: profile?.isAdmin ?? false,
    exceptUsers: profile ? [ profile._id ] : [],
  })
  const result = DiscussionDetailQueryResultSchema.encode({
    ...discussion, comments, isJury: isDiscussionJury ?? false,
  })
  return createEnvelopedResponse(ctx, result)
}

async function createDiscussion (ctx: Context) {
  const payload = DiscussionCreatePayloadSchema.safeParse(ctx.request.body)
  if (!payload.success) {
    return createZodErrorResponse(ctx, payload.error)
  }

  const profile = await loadProfile(ctx)
  let isManaged = profile.isAdmin ?? false

  let problem: Types.ObjectId | null = null
  if (payload.data.problem) {
    const problemDoc = await loadProblem(ctx, payload.data.problem, payload.data.contest)

    problem = problemDoc._id
    if (!isManaged && problemDoc.owner?.equals(profile._id) === true) {
      isManaged = true
    }
  }

  let contest: Types.ObjectId | null = null
  if (payload.data.contest) {
    const contestDoc = await loadContest(ctx, payload.data.contest)

    contest = contestDoc._id
    if (contestDoc.course) {
      const { role } = await loadCourse(ctx, contestDoc.course)
      if (role.manageContest) {
        isManaged = true
      }
    }
  }

  const { type, title, content } = payload.data
  const author = profile._id

  if (publicDiscussionTypes.includes(type) && !isManaged) {
    return createErrorResponse(ctx,
      'Insufficient privileges to create this type of discussion', ErrorCode.Forbidden,
    )
  }

  try {
    const discussion = await discussionService.createDiscussion({
      author, problem, contest, type, title, content,
    })
    logger.info(`Discussion <Discussion:${discussion.discussionId}> created by user <User:${profile.uid}> [${ctx.state.requestId}] from ${ctx.state.clientIp}`)
    return createEnvelopedResponse(ctx, { discussionId: discussion.discussionId })
  } catch (err: any) {
    return createErrorResponse(ctx, err.message, ErrorCode.InternalServerError)
  }
}

async function createComment (ctx: Context) {
  const payload = CommentCreatePayloadSchema.safeParse(ctx.request.body)
  if (!payload.success) {
    return createZodErrorResponse(ctx, payload.error)
  }

  const discussion = await loadDiscussion(ctx)
  if (!discussion) {
    return createErrorResponse(ctx,
      'Discussion not found or access denied', ErrorCode.NotFound,
    )
  }

  const isAnnouncement = discussion.type === DiscussionType.PublicAnnouncement
  const isArchived = discussion.type === DiscussionType.ArchivedDiscussion
  const { isDiscussionJury } = ctx.state
  const isJury = isDiscussionJury ?? false
  if (isArchived || (isAnnouncement && !isJury)) {
    return createErrorResponse(ctx,
      'Comments are not allowed for this discussion', ErrorCode.Forbidden,
    )
  }

  const profile = await loadProfile(ctx)
  try {
    const comment = await discussionService.createComment(
      discussion._id, { author: profile._id, content: payload.data.content },
    )
    logger.info(`Comment <Comment:${comment.commentId}> created in Discussion <Discussion:${discussion.discussionId}> by user <User:${profile.uid}> [${ctx.state.requestId}] from ${ctx.state.clientIp}`)
    return createEnvelopedResponse(ctx, null)
  } catch (err: any) {
    return createErrorResponse(ctx, err.message, ErrorCode.InternalServerError)
  }
}

const discussionController = {
  findDiscussions,
  getDiscussion,
  createDiscussion,
  createComment,
} as const

export default discussionController
