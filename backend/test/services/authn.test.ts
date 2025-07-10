import type { UserDocument } from '../../src/models/User'
import test from 'ava'
import dotenvFlow from 'dotenv-flow'
import User from '../../src/models/User'
import authnService from '../../src/services/authn'
import { privilege } from '../../src/utils/constants'
import '../../src/config/db'

dotenvFlow.config()

const nonExistUserId = 'nonExistYZB06'
const anyPassword = '2e2dc4fac423cf06eb7fcf0337477a190d02d1472784c355c9508ddac3c1ce7a2e2dc4fa'
const testUsers: Record<string, Partial<UserDocument>> = {
  banned: {
    uid: 'testZLUN4',
    pwd: '557ec670508dd9bca0e8913b6749783764cb88800f811bfebd73bd79197fa5a68d30c94f',
    privilege: privilege.Banned,
  },
  normal: {
    uid: 'testFUJ7U',
    pwd: '86ebbe12e596167a72db8776e420718aff2fbf0f1b395519bb7504056ecffc831c443ace',
    privilege: privilege.User,
  },
  admin: {
    uid: 'testL8FKT',
    pwd: '82fb3bfa4d014ee1d152f605950ee604dce0cbdf4d9c089a6179451b1648b243da3098c2',
    privilege: privilege.Admin,
  },
  root: {
    uid: 'testG5VM7',
    pwd: '225d9fc0a1b81022c407f21850ca0f2541107e729a9abff70bd8493a8c5112c808fa33aa',
    privilege: privilege.Root,
  },
}

test.before(async (_) => {
  for (const user of Object.values(testUsers)) {
    await User.findOneAndUpdate({ uid: user.uid }, user, { upsert: true })
  }
})

test('isLogin (no session)', async (t) => {
  const ctx = { state: {}, session: {} } as any

  const result1 = await authnService.isLogin(ctx)
  t.false(result1)
  t.is(ctx.state.profile, undefined)

  const result2 = await authnService.isLogin(ctx)
  t.false(result2)
  t.is(ctx.state.profile, undefined)
})

test('isLogin (non-existent user)', async (t) => {
  const ctx = {
    state: {},
    session: {
      profile: {
        uid: nonExistUserId,
        pwd: anyPassword,
        privilege: privilege.User,
      },
    },
  } as any
  const result = await authnService.isLogin(ctx)

  t.false(result)
  t.is(ctx.state.profile, undefined)
  t.is(ctx.session.profile, undefined)
})

test('isLogin (password changed)', async (t) => {
  const ctx = {
    state: {},
    session: {
      profile: Object.assign({},
        testUsers.normal,
        { pwd: anyPassword },
      ),
    },
  } as any
  const result = await authnService.isLogin(ctx)

  t.false(result)
  t.is(ctx.state.profile, undefined)
  t.is(ctx.session.profile, undefined)
})

test('isLogin (privilege changed)', async (t) => {
  const ctx = {
    state: {},
    session: {
      profile: Object.assign({},
        testUsers.normal,
        { privilege: privilege.Admin },
      ),
    },
  } as any
  const result = await authnService.isLogin(ctx)

  t.true(result)
  t.truthy(ctx.state.profile)
  t.is(ctx.state.profile.privilege, privilege.User)
})

test('isLogin (banned user)', async (t) => {
  const ctx = {
    state: {},
    session: {
      profile: testUsers.banned,
    },
  } as any
  const result = await authnService.isLogin(ctx)

  t.false(result)
  t.is(ctx.state.profile, undefined)
  t.is(ctx.session.profile, undefined)
})

test('isLogin (normal user)', async (t) => {
  const ctx = {
    state: {},
    session: {
      profile: testUsers.normal,
    },
  } as any

  const result1 = await authnService.isLogin(ctx)
  t.true(result1)
  t.truthy(ctx.state.profile)
  t.is(ctx.state.profile.uid, testUsers.normal.uid)

  const result2 = await authnService.isLogin(ctx)
  t.true(result2)
  t.truthy(ctx.state.profile)
  t.is(ctx.state.profile.uid, testUsers.normal.uid)
})

test('isAdmin (no session)', async (t) => {
  const ctx = { state: {}, session: {} } as any
  const result = await authnService.isAdmin(ctx)

  t.false(result)
  t.is(ctx.state.profile, undefined)
  t.is(ctx.session.profile, undefined)
})

test('isAdmin (banned user)', async (t) => {
  const ctx = {
    state: {},
    session: {
      profile: testUsers.banned,
    },
  } as any
  const result = await authnService.isAdmin(ctx)

  t.false(result)
  t.is(ctx.state.profile, undefined)
  t.is(ctx.session.profile, undefined)
})

test('isAdmin (normal user)', async (t) => {
  const ctx = {
    state: {},
    session: {
      profile: testUsers.normal,
    },
  } as any
  const result = await authnService.isAdmin(ctx)

  t.false(result)
  t.truthy(ctx.state.profile)
})

test('isAdmin (admin user)', async (t) => {
  const ctx = {
    state: {},
    session: {
      profile: testUsers.admin,
    },
  } as any
  const result = await authnService.isAdmin(ctx)

  t.true(result)
  t.truthy(ctx.state.profile)
})

test('isAdmin (root user)', async (t) => {
  const ctx = {
    state: {},
    session: {
      profile: testUsers.root,
    },
  } as any
  const result = await authnService.isAdmin(ctx)

  t.true(result)
  t.truthy(ctx.state.profile)
})

test('isRoot (no session)', async (t) => {
  const ctx = { state: {}, session: {} } as any
  const result = await authnService.isRoot(ctx)

  t.false(result)
  t.is(ctx.state.profile, undefined)
  t.is(ctx.session.profile, undefined)
})

test('isRoot (banned user)', async (t) => {
  const ctx = {
    state: {},
    session: {
      profile: testUsers.banned,
    },
  } as any
  const result = await authnService.isRoot(ctx)

  t.false(result)
  t.is(ctx.state.profile, undefined)
  t.is(ctx.session.profile, undefined)
})

test('isRoot (normal user)', async (t) => {
  const ctx = {
    state: {},
    session: {
      profile: testUsers.normal,
    },
  } as any
  const result = await authnService.isRoot(ctx)

  t.false(result)
  t.truthy(ctx.state.profile)
})

test('isRoot (admin user)', async (t) => {
  const ctx = {
    state: {},
    session: {
      profile: testUsers.admin,
    },
  } as any
  const result = await authnService.isRoot(ctx)

  t.false(result)
  t.truthy(ctx.state.profile)
})

test('isRoot (root user)', async (t) => {
  const ctx = {
    state: {},
    session: {
      profile: testUsers.root,
    },
  } as any
  const result = await authnService.isRoot(ctx)

  t.true(result)
  t.truthy(ctx.state.profile)
})
