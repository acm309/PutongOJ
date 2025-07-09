import type { UserEntity } from '../models/User'
import type { AppContext, SessionProfile } from '../types'
import User from '../models/User'

async function checkSession (
  ctx: AppContext,
): Promise<UserEntity | undefined> {
  if (ctx.state.authnChecked) {
    return ctx.state.profile
  }
  ctx.state.authnChecked = true
  if (!ctx.session.profile) {
    return
  }

  const session = ctx.session.profile as SessionProfile
  const user = await User.findOne({ uid: session.uid }).exec()

  const sessionInvalid = !user
    || user.pwd !== session.pwd
    || user.isBanned

  if (sessionInvalid) {
    delete ctx.session.profile
    return
  }
  if (user.privilege !== session.privilege) {
    ctx.session.profile.privilege = user.privilege
  }

  return ctx.state.profile = user
}

export async function isLogin (ctx: AppContext): Promise<boolean> {
  return !!(await checkSession(ctx))
}

export async function isAdmin (ctx: AppContext): Promise<boolean> {
  const profile = await checkSession(ctx)
  return profile?.isAdmin ?? false
}

export async function isRoot (ctx: AppContext): Promise<boolean> {
  const profile = await checkSession(ctx)
  return profile?.isRoot ?? false
}

export default {
  isLogin,
  isAdmin,
  isRoot,
}
