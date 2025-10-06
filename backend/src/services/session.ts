import type { AccountSession } from '@putongoj/shared'
import type { Context } from 'koa'
import type { UserDocument } from '../models/User'
import { passwordChecksum } from '../utils'

export function getSession (ctx: Context): AccountSession | null {
  return ctx.session.profile || null
}

export function setSession (ctx: Context, user: UserDocument): AccountSession {
  const { uid, privilege, pwd } = user
  const checksum = passwordChecksum(pwd)
  const profile: AccountSession = {
    uid,
    privilege,
    checksum,
    verifyContest: [],
  }

  ctx.session.profile = profile
  return profile
}

export function deleteSession (ctx: Context): void {
  delete ctx.session.profile
}

const sessionService = {
  getSession,
  setSession,
  deleteSession,
} as const

export default sessionService
