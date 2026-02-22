import type { Context } from 'koa'
import {
  ErrorCode,
  SessionListQueryResultSchema,
  SessionRevokeOthersResultSchema,
} from '@putongoj/shared'
import { loadProfile } from '../middlewares/authn'
import sessionService from '../services/session'
import { createEnvelopedResponse, createErrorResponse } from '../utils'

export async function listSessions (ctx: Context) {
  const profile = await loadProfile(ctx)
  const userId = profile._id.toString()
  const sessions = await sessionService.listSessions(userId)

  const currentSessionId = ctx.state.sessionId
  const result = SessionListQueryResultSchema.parse(sessions.map(s => ({
    sessionId: s.sessionId,
    current: s.sessionId === currentSessionId,
    lastAccessAt: s.lastAccessAt,
    loginAt: s.info.loginAt,
    loginIp: s.info.loginIp,
    userAgent: s.info.userAgent,
  })))

  return createEnvelopedResponse(ctx, result)
}

export async function revokeSession (ctx: Context) {
  const profile = await loadProfile(ctx)
  const { sessionId } = ctx.params
  if (!sessionId || typeof sessionId !== 'string') {
    return createErrorResponse(ctx, 'Invalid session ID', ErrorCode.BadRequest)
  }
  if (sessionId === ctx.state.sessionId) {
    return createErrorResponse(ctx,
      'Cannot revoke current session, use logout instead', ErrorCode.BadRequest,
    )
  }

  await sessionService.revokeSession(profile._id.toString(), sessionId)
  ctx.auditLog.info(`<User:${profile.uid}> revoked <Session:${sessionId}>`)
  return createEnvelopedResponse(ctx, null)
}

export async function revokeOtherSessions (ctx: Context) {
  const profile = await loadProfile(ctx)
  const currentSessionId = ctx.state.sessionId
  if (!currentSessionId) {
    return createErrorResponse(ctx, 'No active session', ErrorCode.BadRequest)
  }

  const removed = await sessionService.revokeOtherSessions(
    profile._id.toString(), currentSessionId,
  )
  ctx.auditLog.info(`<User:${profile.uid}> revoked ${removed} other session(s)`)
  const result = SessionRevokeOthersResultSchema.parse({ removed })
  return createEnvelopedResponse(ctx, result)
}

const sessionController = {
  listSessions,
  revokeSession,
  revokeOtherSessions,
} as const

export default sessionController
