import type { Context, Middleware } from 'koa'
import type { AuthenticatedUser } from '../persistence/types'
import { getDatabase } from '../config/postgres'
import { toAuthenticatedUser } from '../persistence/mappers'
import sessionService from '../services/session'
import { ERR_LOGIN_REQUIRE, ERR_PERM_DENIED } from '../utils/constants'

export async function checkSession (ctx: Context): Promise<AuthenticatedUser | undefined> {
  if (ctx.state.authnChecked) { return ctx.state.profile }
  ctx.state.authnChecked = true
  const { userId, sessionId } = ctx.session
  if (!userId || !sessionId) { return }
  const sessionInfo = await sessionService.accessSession(userId, sessionId)
  if (!sessionInfo) {
    delete ctx.session.userId
    delete ctx.session.sessionId
    return
  }
  const parsedUserId = Number(userId)
  if (!Number.isSafeInteger(parsedUserId) || parsedUserId <= 0) {
    await sessionService.revokeSession(userId, sessionId)
    delete ctx.session.userId
    delete ctx.session.sessionId
    return
  }
  const database = await getDatabase()
  const record = await database.user.findUnique({ where: { id: parsedUserId } })
  if (!record) {
    await sessionService.revokeSession(userId, sessionId)
    delete ctx.session.userId
    delete ctx.session.sessionId
    return
  }
  const user = toAuthenticatedUser(record)
  if (user.isBanned) {
    await sessionService.revokeSession(userId, sessionId)
    delete ctx.session.userId
    delete ctx.session.sessionId
    return
  }
  if ((user.lastVisitedAt?.getTime() ?? 0) < Date.now() - 5_000) {
    await database.user.update({
      where: { id: user.id },
      data: { lastRequestId: ctx.state.requestId, lastVisitedAt: new Date() },
    })
    user.lastRequestId = ctx.state.requestId
    user.lastVisitedAt = new Date()
  }
  ctx.state.profile = user
  ctx.state.sessionId = sessionId
  return user
}

export async function loadProfile (ctx: Context): Promise<AuthenticatedUser> {
  const profile = await checkSession(ctx)
  if (!profile) { return ctx.throw(...ERR_LOGIN_REQUIRE) }
  return profile
}

export const loginRequire: Middleware = async (ctx, next) => {
  await loadProfile(ctx)
  await next()
}
export const adminRequire: Middleware = async (ctx, next) => {
  if (!(await loadProfile(ctx)).isAdmin) { return ctx.throw(...ERR_PERM_DENIED) }
  await next()
}
export const rootRequire: Middleware = async (ctx, next) => {
  if (!(await loadProfile(ctx)).isRoot) { return ctx.throw(...ERR_PERM_DENIED) }
  await next()
}

export default { checkSession, loadProfile, loginRequire, adminRequire, rootRequire }
