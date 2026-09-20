import type Router from '@koa/router'
import type { Context } from 'koa'
import type { DiscussionUpdateDto } from '../../services/discussion.ts'
import {
  AdminCommentUpdatePayloadSchema,
  AdminDiscussionUpdatePayloadSchema,
  ErrorCode,
} from '@putong-oj/shared'
import { loadProfile } from '../../middlewares/authn.ts'
import { contestService } from '../../services/contest.ts'
import discussionService from '../../services/discussion.ts'
import problemService from '../../services/problem.ts'
import userService from '../../services/user.ts'
import {
  createEnvelopedResponse,
  createErrorResponse,
  createZodErrorResponse,
} from '../../utils/index.ts'

function parseDiscussionId (ctx: Context): number | null {
  const discussionIdStr = ctx.params.discussionId
  const discussionId = Number(discussionIdStr)

  if (Number.isNaN(discussionId) || !Number.isInteger(discussionId) || discussionId <= 0) {
    createErrorResponse(ctx, ErrorCode.BadRequest, 'Invalid discussion ID')
    return null
  }
  return discussionId
}

export async function updateDiscussion (ctx: Context) {
  const discussionId = parseDiscussionId(ctx)
  if (discussionId === null) {
    return
  }

  const payload = AdminDiscussionUpdatePayloadSchema.safeParse(ctx.request.body)
  if (!payload.success) {
    return createZodErrorResponse(ctx, payload.error)
  }

  const update = {} as DiscussionUpdateDto
  if (payload.data.author !== undefined) {
    const author = await userService.getUser(payload.data.author)
    if (!author) {
      return createErrorResponse(ctx, ErrorCode.BadRequest, 'Author user not found')
    }
    update.author = author._id
  }
  if (payload.data.problem !== undefined) {
    if (payload.data.problem === null) {
      update.problem = null
    } else {
      const problem = await problemService.getProblem(payload.data.problem)
      if (!problem) {
        return createErrorResponse(ctx, ErrorCode.BadRequest, 'Problem not found')
      }
      update.problem = problem._id
    }
  }
  if (payload.data.contest !== undefined) {
    if (payload.data.contest === null) {
      update.contest = null
    } else {
      const contest = await contestService.getContest(payload.data.contest)
      if (!contest) {
        return createErrorResponse(ctx, ErrorCode.BadRequest, 'Contest not found')
      }
      update.contest = contest._id
    }
  }
  if (payload.data.type !== undefined) {
    update.type = payload.data.type
  }
  if (payload.data.pinned !== undefined) {
    update.pinned = payload.data.pinned
  }
  if (payload.data.title !== undefined) {
    update.title = payload.data.title
  }

  try {
    const result = await discussionService.updateDiscussion(discussionId, update)
    if (!result) {
      return createErrorResponse(ctx, ErrorCode.NotFound)
    }
    const profile = await loadProfile(ctx)
    ctx.auditLog.info(`<Discussion:${discussionId}> updated by <User:${profile.uid}>`)
    return createEnvelopedResponse(ctx, null)
  } catch (err) {
    ctx.auditLog.error('Failed to update discussion', err)
    return createErrorResponse(ctx, ErrorCode.InternalServerError)
  }
}

function parseCommentId (ctx: Context): number | null {
  const commentIdStr = ctx.params.commentId
  const commentId = Number(commentIdStr)

  if (Number.isNaN(commentId) || !Number.isInteger(commentId) || commentId <= 0) {
    createErrorResponse(ctx, ErrorCode.BadRequest, 'Invalid comment ID')
    return null
  }
  return commentId
}

export async function updateComment (ctx: Context) {
  const commentId = parseCommentId(ctx)
  if (commentId === null) {
    return
  }

  const payload = AdminCommentUpdatePayloadSchema.safeParse(ctx.request.body)
  if (!payload.success) {
    return createZodErrorResponse(ctx, payload.error)
  }

  try {
    const result = await discussionService.updateComment(commentId, {
      hidden: payload.data.hidden,
    })
    if (!result) {
      return createErrorResponse(ctx, ErrorCode.NotFound)
    }
    const profile = await loadProfile(ctx)
    ctx.auditLog.info(`<Comment:${commentId}> updated by <User:${profile.uid}>`)
    return createEnvelopedResponse(ctx, null)
  } catch (err) {
    ctx.auditLog.error('Failed to update comment', err)
    return createErrorResponse(ctx, ErrorCode.InternalServerError)
  }
}

function registerAdminDiscussionHandlers (router: Router) {
  router.put('/discussions/:discussionId', updateDiscussion)
  router.put('/comments/:commentId', updateComment)
}

export default registerAdminDiscussionHandlers
