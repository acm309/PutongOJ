import type { Context } from 'koa'
import type { UserDocument } from '../models/User'
import type { SessionProfile } from '../types'
import { passwordChecksum } from '../utils'

export function setUserSession (
  ctx: Context,
  user: UserDocument,
): SessionProfile {
  const { uid, privilege, pwd } = user
  const checksum = passwordChecksum(pwd)
  const profile: SessionProfile = {
    uid,
    privilege,
    checksum,
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
