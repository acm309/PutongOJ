import test from 'ava'
import supertest from 'supertest'
import app from '../../../src/app'
import config from '../../../src/config'
import { encryptData } from '../../../src/services/crypto'

const server = app.listen()
const request = supertest.agent(server)

// ─── shared state ─────────────────────────────────────────────────────────────

let contestId: number | null = null

const now = Date.now()
const baseContest = {
  title: 'Admin Test Contest',
  startsAt: new Date(now - 60_000).toISOString(),
  endsAt: new Date(now + 5 * 60 * 60_000).toISOString(),
  isHidden: false,
  isPublic: true,
}

test.before('Login as admin', async (t) => {
  const login = await request
    .post('/api/account/login')
    .send({
      username: 'admin',
      password: await encryptData(config.deploy.adminInitPwd),
    })

  t.is(login.status, 200)
  t.true(login.body.success)
})

// ─── POST /api/contests ───────────────────────────────────────────────────────

test.serial('Create a contest', async (t) => {
  const res = await request
    .post('/api/contests')
    .send(baseContest)

  t.is(res.status, 200)
  t.true(res.body.success)
  t.is(typeof res.body.data.contestId, 'number')

  contestId = res.body.data.contestId
})

test.serial('Create contest: missing required fields returns error', async (t) => {
  const res = await request
    .post('/api/contests')
    .send({ title: 'Incomplete' })

  t.is(res.status, 200)
  t.false(res.body.success)
})

test.serial('Create contest: endsAt before startsAt returns error', async (t) => {
  const res = await request
    .post('/api/contests')
    .send({
      ...baseContest,
      title: 'Bad Time Contest',
      startsAt: new Date(now + 60 * 60_000).toISOString(),
      endsAt: new Date(now).toISOString(),
    })

  t.is(res.status, 200)
  t.false(res.body.success)
})

test.serial('Create contest: title exceeding max length returns error', async (t) => {
  const res = await request
    .post('/api/contests')
    .send({
      ...baseContest,
      title: 'A'.repeat(201),
    })

  t.is(res.status, 200)
  t.false(res.body.success)
})

// ─── GET /api/contests ────────────────────────────────────────────────────────

test.serial('List contests: newly created contest appears', async (t) => {
  if (!contestId) { return t.fail('No contestId from prior test') }

  const res = await request.get('/api/contests')

  t.is(res.status, 200)
  t.true(res.body.success)
  t.true(res.body.data.docs.some((c: any) => c.contestId === contestId))
})

test.serial('List contests: title filter works', async (t) => {
  const res = await request.get('/api/contests').query({ title: 'Admin Test' })

  t.is(res.status, 200)
  t.true(res.body.success)
  t.true(res.body.data.docs.every((c: any) => c.title.includes('Admin Test')))
})

// ─── GET /api/contests/:contestId ────────────────────────────────────────────

test.serial('Get contest detail: admin is jury', async (t) => {
  if (!contestId) { return t.fail('No contestId from prior test') }

  const res = await request.get(`/api/contests/${contestId}`)

  t.is(res.status, 200)
  t.true(res.body.success)
  t.is(res.body.data.contestId, contestId)
  t.is(res.body.data.title, baseContest.title)
  t.true(res.body.data.isJury)
  t.true(Array.isArray(res.body.data.problems))
})

test.serial('Get non-existent contest returns 404', async (t) => {
  const res = await request.get('/api/contests/99999999')

  t.is(res.status, 200)
  t.false(res.body.success)
  t.is(res.body.code, 404)
})

// ─── GET /api/contests/:contestId/configs ────────────────────────────────────

test.serial('Get contest config: returns full config', async (t) => {
  if (!contestId) { return t.fail('No contestId from prior test') }

  const res = await request.get(`/api/contests/${contestId}/configs`)

  t.is(res.status, 200)
  t.true(res.body.success)
  const cfg = res.body.data
  t.is(cfg.contestId, contestId)
  t.is(typeof cfg.title, 'string')
  t.true(Array.isArray(cfg.allowedUsers))
  t.true(Array.isArray(cfg.allowedGroups))
  t.true(Array.isArray(cfg.problems))
  t.true(Array.isArray(cfg.ipWhitelist))
  t.is(typeof cfg.ipWhitelistEnabled, 'boolean')
})

// ─── PUT /api/contests/:contestId/configs ────────────────────────────────────

test.serial('Update contest config: change title', async (t) => {
  if (!contestId) { return t.fail('No contestId from prior test') }

  const res = await request
    .put(`/api/contests/${contestId}/configs`)
    .send({ title: 'Updated Admin Contest' })

  t.is(res.status, 200)
  t.true(res.body.success)

  const verify = await request.get(`/api/contests/${contestId}/configs`)
  t.is(verify.body.data.title, 'Updated Admin Contest')
})

test.serial('Update contest config: set isPublic and isHidden', async (t) => {
  if (!contestId) { return t.fail('No contestId from prior test') }

  const res = await request
    .put(`/api/contests/${contestId}/configs`)
    .send({ isPublic: false, isHidden: true })

  t.is(res.status, 200)
  t.true(res.body.success)

  const verify = await request.get(`/api/contests/${contestId}/configs`)
  t.false(verify.body.data.isPublic)
  t.true(verify.body.data.isHidden)
})

test.serial('Update contest config: set IP whitelist', async (t) => {
  if (!contestId) { return t.fail('No contestId from prior test') }

  const res = await request
    .put(`/api/contests/${contestId}/configs`)
    .send({
      ipWhitelistEnabled: true,
      ipWhitelist: [
        { cidr: '127.0.0.0/8', comment: 'loopback' },
        { cidr: '10.0.0.0/8', comment: null },
      ],
    })

  t.is(res.status, 200)
  t.true(res.body.success)

  const verify = await request.get(`/api/contests/${contestId}/configs`)
  t.true(verify.body.data.ipWhitelistEnabled)
  t.is(verify.body.data.ipWhitelist.length, 2)
  t.true(verify.body.data.ipWhitelist.some((e: any) => e.cidr === '127.0.0.0/8'))
})

test.serial('Update contest config: clear IP whitelist', async (t) => {
  if (!contestId) { return t.fail('No contestId from prior test') }

  const res = await request
    .put(`/api/contests/${contestId}/configs`)
    .send({
      ipWhitelistEnabled: false,
      ipWhitelist: [],
    })

  t.is(res.status, 200)
  t.true(res.body.success)

  const verify = await request.get(`/api/contests/${contestId}/configs`)
  t.false(verify.body.data.ipWhitelistEnabled)
  t.is(verify.body.data.ipWhitelist.length, 0)
})

test.serial('Update contest config: invalid payload returns error', async (t) => {
  if (!contestId) { return t.fail('No contestId from prior test') }

  const res = await request
    .put(`/api/contests/${contestId}/configs`)
    .send({ title: 'A'.repeat(201) }) // title too long

  t.is(res.status, 200)
  t.false(res.body.success)
})

// ─── GET /api/contests/:contestId/ranklist ────────────────────────────────────

test.serial('Get ranklist: returns array (admin/jury)', async (t) => {
  if (!contestId) { return t.fail('No contestId from prior test') }

  const res = await request.get(`/api/contests/${contestId}/ranklist`)

  t.is(res.status, 200)
  t.true(res.body.success)
  t.true(Array.isArray(res.body.data))
})

// ─── GET /api/contests/:contestId/solutions ──────────────────────────────────

test.serial('Find solutions (jury): returns paginated result', async (t) => {
  if (!contestId) { return t.fail('No contestId from prior test') }

  const res = await request.get(`/api/contests/${contestId}/solutions`)

  t.is(res.status, 200)
  t.true(res.body.success)
  t.true(Array.isArray(res.body.data.docs))
})

// ─── Contest participation status: admin is never blocked by IP ───────────────

test.serial('Get participation status: admin is jury, never ip-blocked', async (t) => {
  // Re-enable IP whitelist with an empty list to ensure non-admin gets blocked
  await request
    .put(`/api/contests/${contestId}/configs`)
    .send({ ipWhitelistEnabled: true, ipWhitelist: [] })

  const res = await request.get(`/api/contests/${contestId}/participation`)

  t.is(res.status, 200)
  t.true(res.body.success)
  t.true(res.body.data.isJury)
  t.false(res.body.data.isIpBlocked) // admin/jury is never blocked

  // Restore
  await request
    .put(`/api/contests/${contestId}/configs`)
    .send({ ipWhitelistEnabled: false, ipWhitelist: [] })
})

test.after.always('close server', () => {
  server.close()
})
