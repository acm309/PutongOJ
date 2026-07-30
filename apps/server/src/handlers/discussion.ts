import type { Context } from 'koa'
import Router from '@koa/router'
import {
  CommentCreatePayloadSchema,
  DiscussionCreatePayloadSchema,
  DiscussionDetailQueryResultSchema,
  DiscussionListQueryResultSchema,
  DiscussionListQuerySchema,
  DiscussionType,
  ErrorCode,
} from '@putongoj/shared'
import { isAdmin } from '../auth/user'
import { loadProfile, loginRequire } from '../middlewares/authn'
import { commentCreateLimit, discussionCreateLimit } from '../middlewares/ratelimit'
import { loadContestState } from '../policies/contest'
import { loadDiscussion } from '../policies/discussion'
import { loadProblemState } from '../policies/problem'
import discussionService from '../services/discussion'
import { createEnvelopedResponse, createErrorResponse, createZodErrorResponse } from '../utils'

async function findDiscussions (ctx: Context) {
  const query = DiscussionListQuerySchema.safeParse(ctx.request.query)
  if (!query.success) { return createZodErrorResponse(ctx, query.error) }
  const profile = ctx.state.profile
  const discussions = await discussionService.findDiscussions(
    query.data,
    {
      ...(query.data.type === undefined ? {} : { types: [ query.data.type ] }),
      ...(query.data.authorId === undefined ? {} : { authorId: query.data.authorId }),
      ...(profile !== undefined && isAdmin(profile) ? {} : { visibleToUserId: profile?.id ?? null }),
    },
  )
  const result = DiscussionListQueryResultSchema.encode({
    ...discussions,
    items: discussions.items.map(item => ({
      ...item,
      author: { id: item.author.id, username: item.author.username, avatarUrl: item.author.avatarUrl },
      problem: item.problem ? { id: item.problem.id } : null,
      contest: item.contest ? { id: item.contest.id } : null,
    })),
  })
  return createEnvelopedResponse(ctx, result)
}

async function getDiscussion (ctx: Context) {
  const state = await loadDiscussion(ctx)
  if (!state) { return createErrorResponse(ctx, ErrorCode.NotFound, 'Discussion not found or access denied') }
  const profile = ctx.state.profile
  const comments = await discussionService.getComments(state.discussion.id, {
    showHidden: profile !== undefined && isAdmin(profile),
    exceptUserIds: profile ? [ profile.id ] : [],
  })
  const result = DiscussionDetailQueryResultSchema.encode({
    ...state.discussion,
    author: { id: state.discussion.author.id, username: state.discussion.author.username },
    problem: state.discussion.problem ? { id: state.discussion.problem.id } : null,
    contest: state.discussion.contest ? { id: state.discussion.contest.id } : null,
    comments: comments.map(comment => ({
      ...comment,
      author: {
        id: comment.author.id,
        username: comment.author.username,
        nickname: comment.author.nickname,
        avatarUrl: comment.author.avatarUrl,
      },
    })),
    isJury: state.isJury,
  })
  return createEnvelopedResponse(ctx, result)
}

async function createDiscussion (ctx: Context) {
  const payload = DiscussionCreatePayloadSchema.safeParse(ctx.request.body)
  if (!payload.success) { return createZodErrorResponse(ctx, payload.error) }
  const profile = await loadProfile(ctx)
  let managed = isAdmin(profile)
  let problemId: number | null = null
  if (payload.data.problemId) {
    const state = await loadProblemState(ctx, payload.data.problemId, payload.data.contestId)
    if (!state) { return createErrorResponse(ctx, ErrorCode.NotFound, 'Problem not found or access denied') }
    problemId = state.problem.id
    managed ||= state.problem.ownerId === profile.id
  }
  let contestId: number | null = null
  if (payload.data.contestId) {
    const state = await loadContestState(ctx, payload.data.contestId)
    if (!state?.accessible) { return createErrorResponse(ctx, ErrorCode.NotFound, 'Contest not found or access denied') }
    contestId = state.contest.id
    managed ||= state.isJury
  }
  if ((
    payload.data.type === DiscussionType.OPEN_DISCUSSION
    || payload.data.type === DiscussionType.PUBLIC_ANNOUNCEMENT
  ) && !managed) { return createErrorResponse(ctx, ErrorCode.Forbidden, 'Insufficient privileges to create this type of discussion') }
  const discussion = await discussionService.createDiscussion({ authorId: profile.id, problemId, contestId, ...payload.data })
  ctx.auditLog.info(`<Discussion:${discussion.id}> created by <User:${profile.username}>`)
  return createEnvelopedResponse(ctx, { id: discussion.id })
}

async function createComment (ctx: Context) {
  const payload = CommentCreatePayloadSchema.safeParse(ctx.request.body)
  if (!payload.success) { return createZodErrorResponse(ctx, payload.error) }
  const state = await loadDiscussion(ctx)
  if (!state) { return createErrorResponse(ctx, ErrorCode.NotFound, 'Discussion not found or access denied') }
  if (
    state.discussion.type === DiscussionType.ARCHIVED_DISCUSSION
    || (state.discussion.type === DiscussionType.PUBLIC_ANNOUNCEMENT && !state.isJury)
  ) { return createErrorResponse(ctx, ErrorCode.Forbidden, 'Comments are not allowed for this discussion') }
  const profile = await loadProfile(ctx)
  await discussionService.createComment(state.discussion.id, profile.id, payload.data.content)
  return createEnvelopedResponse(ctx, null)
}

function registerDiscussionHandlers (router: Router) {
  const discussionRouter = new Router({ prefix: '/discussions' })
  discussionRouter.get('/', findDiscussions)
  discussionRouter.post('/', loginRequire, discussionCreateLimit, createDiscussion)
  discussionRouter.get('/:discussionId', getDiscussion)
  discussionRouter.post('/:discussionId/comments', loginRequire, commentCreateLimit, createComment)
  router.use(discussionRouter.routes(), discussionRouter.allowedMethods())
}
export default registerDiscussionHandlers
