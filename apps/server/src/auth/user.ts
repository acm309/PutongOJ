import type { Prisma } from '@putongoj/db'
import { UserPrivilege } from '@putongoj/shared'

/**
 * The persisted user record carried through an authenticated request.
 * Authorization is derived from the canonical privilege enum instead of
 * adding virtual fields to User.
 */
export const authenticatedUserSelect = {
  id: true,
  username: true,
  passwordHash: true,
  privilege: true,
  storageQuota: true,
  nickname: true,
  avatarUrl: true,
  motto: true,
  email: true,
  school: true,
  lastRequestId: true,
  lastVisitedAt: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.UserSelect

export type AuthenticatedUser = Prisma.UserGetPayload<{
  select: typeof authenticatedUserSelect
}>

export function isBanned (user: Pick<AuthenticatedUser, 'privilege'>): boolean {
  return user.privilege === UserPrivilege.BANNED
}

export function isAdmin (user: Pick<AuthenticatedUser, 'privilege'>): boolean {
  return user.privilege === UserPrivilege.ADMIN || user.privilege === UserPrivilege.ROOT
}

export function isRoot (user: Pick<AuthenticatedUser, 'privilege'>): boolean {
  return user.privilege === UserPrivilege.ROOT
}
