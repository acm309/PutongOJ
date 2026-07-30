import test from 'ava'
import { getDatabase } from '../../src/config/postgres'
import { toAuthenticatedUser } from '../../src/persistence/mappers'
import { userSeeds } from '../seeds/user'

test('authenticated user derives flags from Prisma user privilege', async (t) => {
  const database = await getDatabase()
  const root = await database.user.findUnique({ where: { username: userSeeds.MauthnRoot.username } })
  const banned = await database.user.findUnique({ where: { username: userSeeds.MauthnBanned.username } })
  if (!root || !banned) { return t.fail('seed users missing') }

  const rootProfile = toAuthenticatedUser(root)
  t.is(rootProfile.id, root.id)
  t.true(rootProfile.isRoot)
  t.true(rootProfile.isAdmin)
  t.false(rootProfile.isBanned)

  const bannedProfile = toAuthenticatedUser(banned)
  t.true(bannedProfile.isBanned)
  t.false(bannedProfile.isAdmin)
})
