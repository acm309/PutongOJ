import type { Context, Middleware } from 'koa'
import type { UserDocument } from '../models/User'
import User from '../models/User'
import sessionService from '../services/session'
import { ERR_LOGIN_REQUIRE, ERR_PERM_DENIED } from '../utils/constants'

export async function checkSession (ctx: Context): Promise<UserDocument | undefined> {
  if (ctx.state.authnChecked) {
    return ctx.state.profile
  }
  ctx.state.authnChecked = true

  const { userId, sessionId } = ctx.session
  if (!userId || !sessionId) {
    return
  }

  const sessionInfo = await sessionService.accessSession(userId, sessionId)
  if (!sessionInfo) {
    ctx.auditLog.warn(`Session ${sessionId} not found in Redis, clearing cookie`)
    delete ctx.session.userId
    delete ctx.session.sessionId
    return
  }

  const user = await User.findById(userId)
  if (!user) {
    ctx.auditLog.warn(`User ${userId} not found, revoking <Session:${sessionId}>`)
    await sessionService.revokeSession(userId, sessionId)
    delete ctx.session.userId
    delete ctx.session.sessionId
    return
  }
  if (user.isBanned) {
    ctx.auditLog.warn(`<User:${user.uid}> is banned, revoking <Session:${sessionId}>`)
    await sessionService.revokeSession(userId, sessionId)
    delete ctx.session.userId
    delete ctx.session.sessionId
    return
  }

  if ((user.lastVisitedAt?.getTime() ?? 0) < Date.now() - 5 * 1000) {
    user.lastRequestId = ctx.state.requestId
    user.lastVisitedAt = new Date()
    await user.save()
  }

  ctx.state.profile = user
  ctx.state.sessionId = sessionId
  return user
}

export async function loadProfile (ctx: Context): Promise<UserDocument> {
  const profile = await checkSession(ctx)
  if (!profile) {
    return ctx.throw(...ERR_LOGIN_REQUIRE)
  }
  return profile
}

const loginRequire: Middleware = async (ctx, next) => {
  await loadProfile(ctx)
  await next()
}

const adminRequire: Middleware = async (ctx, next) => {
  const profile = await loadProfile(ctx)
  if (!profile.isAdmin) {
    return ctx.throw(...ERR_PERM_DENIED)
  }
  await next()
}

const rootRequire: Middleware = async (ctx, next) => {
  const profile = await loadProfile(ctx)
  if (!profile.isRoot) {
    return ctx.throw(...ERR_PERM_DENIED)
  }
  await next()
}

const authnMiddleware = {
  checkSession,
  loadProfile,
  loginRequire,
  adminRequire,
  rootRequire,
}

export default authnMiddleware
