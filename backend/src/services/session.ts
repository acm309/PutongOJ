import type { Context } from 'koa'
import type { UserDocument } from '../models/User'
import type { SessionProfile } from '../types'
import { pick } from 'lodash'

export function setUserSession (
  ctx: Context,
  user: UserDocument,
): SessionProfile {
  const profile: SessionProfile = {
    ...pick(user, [
      'uid', 'nick', 'privilege', 'pwd',
    ]),
    verifyContest: [],
  }
  ctx.session.profile = profile
  return profile
}

export function deleteUserSession (ctx: Context): void {
  delete ctx.session.profile
}

const sessionService = {
  setUserSession,
  deleteUserSession,
} as const

export default sessionService
