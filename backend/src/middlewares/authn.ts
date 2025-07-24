import type { Context, Middleware } from 'koa'
import type { UserDocument } from '../models/User'
import type { SessionProfile } from '../types'
import User from '../models/User'
import { ERR_LOGIN_REQUIRE, ERR_PERM_DENIED } from '../utils/error'

export async function checkSession (
  ctx: Context,
): Promise<UserDocument | undefined> {
  if (ctx.state.authnChecked) {
    return ctx.state.profile
  }
  ctx.state.authnChecked = true

  if (!ctx.session.profile) {
    return
  }
  const session = ctx.session.profile as SessionProfile

  const user = await User.findOne({ uid: session.uid })
  if (!user || user.pwd !== session.pwd || user.isBanned) {
    delete ctx.session.profile
    return
  }
  if (user.privilege !== session.privilege) {
    ctx.session.profile.privilege = user.privilege
  }

  ctx.state.profile = user
  return user
}

export async function loadProfile (
  ctx: Context,
): Promise<UserDocument> {
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
  /** @deprecated Use loginRequire */
  login: loginRequire,
  /** @deprecated Use adminRequire */
  admin: adminRequire,
  /** @deprecated Use rootRequire */
  root: rootRequire,
}

export default module.exports = authnMiddleware
