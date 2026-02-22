import type { UserDocument } from '../../src/models/User'
import test from 'ava'
import authnMiddleware from '../../src/middlewares/authn'
import User from '../../src/models/User'
import sessionService from '../../src/services/session'
import { ERR_LOGIN_REQUIRE, ERR_PERM_DENIED } from '../../src/utils/error'
import { userSeeds } from '../seeds/user'
import '../../src/config/db'

const noopLog = { info () {}, warn () {}, error () {} }
const nonExistUserId = '000000000000000000000000'

// Resolved after test.before – populated with real Mongo _id strings
const testUsers: Record<string, { _id: string, user: UserDocument }> = {} as any

test.before('resolve user ids', async () => {
  for (const key of [ 'MauthnBanned', 'MauthnNormal', 'MauthnAdmin', 'MauthnRoot' ] as const) {
    const user = await User.findOne({ uid: userSeeds[key].uid })
    if (!user) { throw new Error(`Seed user ${key} not found`) }
    testUsers[key] = { _id: user._id.toString(), user }
  }
})

const parseError = (code: number, message: string): string => {
  return `Error ${code}: ${message}`
}

const throwError = (code: number, message: string) => {
  throw new Error(parseError(code, message))
}

// ─── checkSession ──────────────────────────────────────────────────────────

test('checkSession (no session)', async (t) => {
  const ctx = { state: {}, session: {}, auditLog: noopLog } as any

  const result = await authnMiddleware.checkSession(ctx)
  t.is(result, undefined)
  t.is(ctx.state.profile, undefined)
})

test('checkSession (already checked)', async (t) => {
  const fakeProfile = { uid: 'already' } as any
  const ctx = {
    state: { authnChecked: true, profile: fakeProfile },
    auditLog: noopLog,
  } as any

  const result = await authnMiddleware.checkSession(ctx)
  t.is(result, fakeProfile)
  t.is(ctx.state.authnChecked, true)
})

test('checkSession (session not in Redis)', async (t) => {
  const { _id } = testUsers.MauthnNormal
  const ctx = {
    state: {},
    session: { userId: _id, sessionId: 'nonexistent_session_id' },
    auditLog: noopLog,
  } as any

  const result = await authnMiddleware.checkSession(ctx)
  t.is(result, undefined)
  t.is(ctx.state.profile, undefined)
  t.is(ctx.session.userId, undefined)
  t.is(ctx.session.sessionId, undefined)
})

test('checkSession (non-existent user)', async (t) => {
  // Create a session for a userId that doesn't exist in MongoDB
  const sessionId = await sessionService.createSession(nonExistUserId, '127.0.0.1', 'test')
  const ctx = {
    state: {},
    session: { userId: nonExistUserId, sessionId },
    auditLog: noopLog,
  } as any

  const result = await authnMiddleware.checkSession(ctx)
  t.is(result, undefined)
  t.is(ctx.state.profile, undefined)
  t.is(ctx.session.userId, undefined)
  t.is(ctx.session.sessionId, undefined)
})

test('checkSession (banned user)', async (t) => {
  const { _id } = testUsers.MauthnBanned
  const sessionId = await sessionService.createSession(_id, '127.0.0.1', 'test')
  const ctx = {
    state: {},
    session: { userId: _id, sessionId },
    auditLog: noopLog,
  } as any

  const result = await authnMiddleware.checkSession(ctx)
  t.is(result, undefined)
  t.is(ctx.state.profile, undefined)
  t.is(ctx.session.userId, undefined)
  t.is(ctx.session.sessionId, undefined)
})

test('checkSession (normal user)', async (t) => {
  const { _id } = testUsers.MauthnNormal
  const sessionId = await sessionService.createSession(_id, '127.0.0.1', 'test')
  const ctx = {
    state: {},
    session: { userId: _id, sessionId },
    auditLog: noopLog,
  } as any

  const result = await authnMiddleware.checkSession(ctx)
  t.truthy(result)
  t.is(result?.uid, userSeeds.MauthnNormal.uid)
  t.is(ctx.state.profile?.uid, userSeeds.MauthnNormal.uid)
  t.is(ctx.state.sessionId, sessionId)
})

// ─── loginRequire ──────────────────────────────────────────────────────────

test('loginRequire (no session)', async (t) => {
  const ctx = { state: {}, session: {}, throw: throwError, auditLog: noopLog } as any

  await t.throwsAsync(
    authnMiddleware.loginRequire(ctx, async () => { }),
    { message: parseError(...ERR_LOGIN_REQUIRE) },
  )
})

test('loginRequire (banned user)', async (t) => {
  const { _id } = testUsers.MauthnBanned
  const sessionId = await sessionService.createSession(_id, '127.0.0.1', 'test')
  const ctx = {
    state: {},
    session: { userId: _id, sessionId },
    throw: throwError,
    auditLog: noopLog,
  } as any

  await t.throwsAsync(
    authnMiddleware.loginRequire(ctx, async () => { }),
    { message: parseError(...ERR_LOGIN_REQUIRE) },
  )
})

test('loginRequire (valid user)', async (t) => {
  const { _id } = testUsers.MauthnNormal
  const sessionId = await sessionService.createSession(_id, '127.0.0.1', 'test')
  const ctx = {
    state: {},
    session: { userId: _id, sessionId },
    auditLog: noopLog,
  } as any

  let nextCalled = false
  await authnMiddleware.loginRequire(ctx, async () => { nextCalled = true })
  t.true(nextCalled)
})

// ─── adminRequire ──────────────────────────────────────────────────────────

test('adminRequire (no session)', async (t) => {
  const ctx = { state: {}, session: {}, throw: throwError, auditLog: noopLog } as any

  await t.throwsAsync(
    async () => authnMiddleware.adminRequire(ctx, async () => { }),
    { message: parseError(...ERR_LOGIN_REQUIRE) },
  )
})

test('adminRequire (normal user)', async (t) => {
  const { _id } = testUsers.MauthnNormal
  const sessionId = await sessionService.createSession(_id, '127.0.0.1', 'test')
  const ctx = {
    state: {},
    session: { userId: _id, sessionId },
    throw: throwError,
    auditLog: noopLog,
  } as any

  await t.throwsAsync(
    async () => authnMiddleware.adminRequire(ctx, async () => { }),
    { message: parseError(...ERR_PERM_DENIED) },
  )
})

test('adminRequire (admin user)', async (t) => {
  const { _id } = testUsers.MauthnAdmin
  const sessionId = await sessionService.createSession(_id, '127.0.0.1', 'test')
  const ctx = {
    state: {},
    session: { userId: _id, sessionId },
    auditLog: noopLog,
  } as any

  let nextCalled = false
  await authnMiddleware.adminRequire(ctx, async () => { nextCalled = true })
  t.true(nextCalled)
})

test('adminRequire (root user)', async (t) => {
  const { _id } = testUsers.MauthnRoot
  const sessionId = await sessionService.createSession(_id, '127.0.0.1', 'test')
  const ctx = {
    state: {},
    session: { userId: _id, sessionId },
    auditLog: noopLog,
  } as any

  let nextCalled = false
  await authnMiddleware.adminRequire(ctx, async () => { nextCalled = true })
  t.true(nextCalled)
})

// ─── rootRequire ───────────────────────────────────────────────────────────

test('rootRequire (no session)', async (t) => {
  const ctx = { state: {}, session: {}, throw: throwError, auditLog: noopLog } as any

  await t.throwsAsync(
    async () => authnMiddleware.rootRequire(ctx, async () => { }),
    { message: parseError(...ERR_LOGIN_REQUIRE) },
  )
})

test('rootRequire (normal user)', async (t) => {
  const { _id } = testUsers.MauthnNormal
  const sessionId = await sessionService.createSession(_id, '127.0.0.1', 'test')
  const ctx = {
    state: {},
    session: { userId: _id, sessionId },
    throw: throwError,
    auditLog: noopLog,
  } as any

  await t.throwsAsync(
    async () => authnMiddleware.rootRequire(ctx, async () => { }),
    { message: parseError(...ERR_PERM_DENIED) },
  )
})

test('rootRequire (admin user)', async (t) => {
  const { _id } = testUsers.MauthnAdmin
  const sessionId = await sessionService.createSession(_id, '127.0.0.1', 'test')
  const ctx = {
    state: {},
    session: { userId: _id, sessionId },
    throw: throwError,
    auditLog: noopLog,
  } as any

  await t.throwsAsync(
    async () => authnMiddleware.rootRequire(ctx, async () => { }),
    { message: parseError(...ERR_PERM_DENIED) },
  )
})

test('rootRequire (root user)', async (t) => {
  const { _id } = testUsers.MauthnRoot
  const sessionId = await sessionService.createSession(_id, '127.0.0.1', 'test')
  const ctx = {
    state: {},
    session: { userId: _id, sessionId },
    auditLog: noopLog,
  } as any

  let nextCalled = false
  await authnMiddleware.rootRequire(ctx, async () => { nextCalled = true })
  t.true(nextCalled)
})
