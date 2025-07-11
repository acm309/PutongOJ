import type { Context, Middleware } from 'koa'
import type { UserDocument } from '../models/User'
import type { SessionProfile } from '../types'
import User from '../models/User'
import { ERR_LOGIN_REQUIRE, ERR_PERM_DENIED } from '../utils/error'

async function checkSession (ctx: Context): Promise<UserDocument | undefined> {
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

const loginRequire: Middleware = async (ctx, next) => {
  const user = await checkSession(ctx)
  if (!user) {
    return ctx.throw(...ERR_LOGIN_REQUIRE)
  }
  await next()
}

const adminRequire: Middleware = async (ctx, next) => {
  const user = await checkSession(ctx)
  if (!user) {
    return ctx.throw(...ERR_LOGIN_REQUIRE)
  }
  if (!user.isAdmin) {
    return ctx.throw(...ERR_PERM_DENIED)
  }
  await next()
}

const rootRequire: Middleware = async (ctx, next) => {
  const user = await checkSession(ctx)
  if (!user) {
    return ctx.throw(...ERR_LOGIN_REQUIRE)
  }
  if (!user.isRoot) {
    return ctx.throw(...ERR_PERM_DENIED)
  }
  await next()
}

const authnMiddleware = {
  checkSession,
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
