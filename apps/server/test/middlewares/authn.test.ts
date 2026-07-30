import test from 'ava'
import { isAdmin, isBanned, isRoot } from '../../src/auth/user'
import { getDatabase } from '../../src/config/postgres'
import { userSeeds } from '../seeds/user'

test('authenticated user derives flags from Prisma user privilege', async (t) => {
  const database = await getDatabase()
  const root = await database.user.findUnique({ where: { username: userSeeds.MauthnRoot.username } })
  const banned = await database.user.findUnique({ where: { username: userSeeds.MauthnBanned.username } })
  if (!root || !banned) { return t.fail('seed users missing') }

  t.is(root.id, root.id)
  t.true(isRoot(root))
  t.true(isAdmin(root))
  t.false(isBanned(root))

  t.true(isBanned(banned))
  t.false(isAdmin(banned))
})
