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
import { loadContestState } from '../policies/contest'
import { loadCourseRoleById } from '../policies/course'
import { loadDiscussion, publicDiscussionTypes } from '../policies/discussion'
import { loadProblemOrThrow } from '../policies/problem'
import discussionService from '../services/discussion'
import { getUser } from '../services/user'
import {
  createEnvelopedResponse,
  createErrorResponse,
  createZodErrorResponse,
} from '../utils'

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
    { author: [ 'uid', 'avatar' ], problem: [ 'pid' ], contest: [ 'contestId' ] },
  )
  const result = DiscussionListQueryResultSchema.encode(discussions)
  return createEnvelopedResponse(ctx, result)
}

async function getDiscussion (ctx: Context) {
  const discussionState = await loadDiscussion(ctx)
  if (!discussionState) {
    return createErrorResponse(ctx,
      'Discussion not found or access denied', ErrorCode.NotFound,
    )
  }

  const { profile } = ctx.state
  const { discussion, isJury } = discussionState
  const comments = await discussionService.getComments(discussion._id, {
    showHidden: profile?.isAdmin ?? false,
    exceptUsers: profile ? [ profile._id ] : [],
  })
  const result = DiscussionDetailQueryResultSchema.encode({
    ...discussion, comments, isJury,
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
    const problemDoc = await loadProblemOrThrow(ctx, payload.data.problem, payload.data.contest)

    problem = problemDoc._id
    if (!isManaged && problemDoc.owner?.equals(profile._id) === true) {
      isManaged = true
    }
  }

  let contest: Types.ObjectId | null = null
  if (payload.data.contest) {
    const contestState = await loadContestState(ctx, payload.data.contest)
    if (!contestState || !contestState.accessible) {
      return createErrorResponse(ctx,
        'Contest not found or access denied', ErrorCode.NotFound,
      )
    }

    contest = contestState.contest._id || null
    if (contestState.contest.course) {
      const role = await loadCourseRoleById(ctx, contestState.contest.course)
      if (role?.manageContest) {
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
    ctx.auditLog.info(`<Discussion:${discussion.discussionId}> created by <User:${profile.uid}>`)
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

  const discussionState = await loadDiscussion(ctx)
  if (!discussionState) {
    return createErrorResponse(ctx,
      'Discussion not found or access denied', ErrorCode.NotFound,
    )
  }

  const { discussion, isJury } = discussionState
  const isAnnouncement = discussion.type === DiscussionType.PublicAnnouncement
  const isArchived = discussion.type === DiscussionType.ArchivedDiscussion
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
    ctx.auditLog.info(`<Comment:${comment.commentId}> created in <Discussion:${discussion.discussionId}> by <User:${profile.uid}>`)
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
