import { ParticipationStatus } from '@putongoj/shared'
import test from 'ava'
import supertest from 'supertest'
import app from '../../../src/app'
import { encryptData } from '../../../src/services/crypto'
import { deploy } from '../../../src/utils/constants'
import { userSeeds } from '../../seeds/user'

const server = app.listen()
const adminAgent = supertest.agent(server)
const userAgent = supertest.agent(server)
const user = userSeeds.primaryuser as { uid: string, pwd: string }

// ─── shared state ─────────────────────────────────────────────────────────────

const state = {
  publicContestId: undefined as number | undefined,
  passwordContestId: undefined as number | undefined,
  ipBlockedContestId: undefined as number | undefined,
  futureContestId: undefined as number | undefined,
  endedContestId: undefined as number | undefined,
}

const now = Date.now()
const makeContest = (overrides: object) => ({
  title: 'User Test Contest',
  startsAt: new Date(now - 60_000).toISOString(),
  endsAt: new Date(now + 5 * 60 * 60_000).toISOString(),
  isHidden: false,
  isPublic: false,
  ...overrides,
})

test.before('Setup: admin creates test contests and user logs in', async (t) => {
  // Login as admin
  const adminLogin = await adminAgent
    .post('/api/account/login')
    .send({
      username: 'admin',
      password: await encryptData(deploy.adminInitPwd),
    })
  t.is(adminLogin.status, 200)
  t.true(adminLogin.body.success)

  // Create a public contest
  const pub = await adminAgent
    .post('/api/contests')
    .send(makeContest({ title: 'User Public Contest', isPublic: true }))
  t.true(pub.body.success, `Create public contest failed: ${pub.body.message}`)
  state.publicContestId = pub.body.data.contestId

  // Create a password-protected contest
  const passwordContestRes = await adminAgent
    .post('/api/contests')
    .send(makeContest({ title: 'User Password Contest' }))
  t.true(passwordContestRes.body.success)
  state.passwordContestId = passwordContestRes.body.data.contestId
  await adminAgent
    .put(`/api/contests/${state.passwordContestId}/configs`)
    .send({ password: 'secret123' })

  // Create a contest with IP whitelist enabled and an empty whitelist (blocks everyone)
  const ipContestRes = await adminAgent
    .post('/api/contests')
    .send(makeContest({ title: 'User IP Blocked Contest', isPublic: true }))
  t.true(ipContestRes.body.success)
  state.ipBlockedContestId = ipContestRes.body.data.contestId
  await adminAgent
    .put(`/api/contests/${state.ipBlockedContestId}/configs`)
    .send({ ipWhitelistEnabled: true, ipWhitelist: [] })

  const futureContestRes = await adminAgent
    .post('/api/contests')
    .send({
      ...makeContest({ title: 'User Future Contest', isPublic: true }),
      startsAt: new Date(now + 60 * 60_000).toISOString(),
      endsAt: new Date(now + 3 * 60 * 60_000).toISOString(),
    })
  t.true(futureContestRes.body.success)
  state.futureContestId = futureContestRes.body.data.contestId
  await adminAgent
    .put(`/api/contests/${state.futureContestId}/configs`)
    .send({ problems: [ 1000 ] })

  const endedContestRes = await adminAgent
    .post('/api/contests')
    .send({
      ...makeContest({ title: 'User Ended Contest', isPublic: true }),
      startsAt: new Date(now - 3 * 60 * 60_000).toISOString(),
      endsAt: new Date(now - 60 * 60_000).toISOString(),
    })
  t.true(endedContestRes.body.success)
  state.endedContestId = endedContestRes.body.data.contestId
  await adminAgent
    .put(`/api/contests/${state.endedContestId}/configs`)
    .send({ problems: [ 1000 ] })

  // Login as primaryuser
  const userLogin = await userAgent
    .post('/api/account/login')
    .send({
      username: user.uid,
      password: await encryptData(user.pwd),
    })
  t.is(userLogin.status, 200)
  t.true(userLogin.body.success)
})

// ─── Cannot create contest as normal user ─────────────────────────────────────

test.serial('User cannot create a contest (forbidden)', async (t) => {
  const res = await userAgent
    .post('/api/contests')
    .send(makeContest({ title: 'User Created Contest' }))

  t.is(res.status, 200)
  t.false(res.body.success)
  t.is(res.body.code, 403)
})

// ─── GET /api/contests/:contestId/participation ──────────────────────────────

test.serial('Participation status: NotApplied before joining', async (t) => {
  if (!state.publicContestId) { return t.fail('No publicContestId') }

  const res = await userAgent.get(`/api/contests/${state.publicContestId}/participation`)

  t.is(res.status, 200)
  t.true(res.body.success)
  t.is(res.body.data.participation, ParticipationStatus.NotApplied)
  t.true(res.body.data.canParticipate)
  t.false(res.body.data.isJury)
  t.false(res.body.data.isIpBlocked)
  t.true(res.body.data.hasStarted)
})

test.serial('Participation status: future contest reports hasStarted=false', async (t) => {
  if (!state.futureContestId) { return t.fail('No futureContestId') }

  const res = await userAgent.get(`/api/contests/${state.futureContestId}/participation`)

  t.is(res.status, 200)
  t.true(res.body.success)
  t.is(res.body.data.participation, ParticipationStatus.NotApplied)
  t.true(res.body.data.canParticipate)
  t.false(res.body.data.hasStarted)
})

// ─── POST /api/contests/:contestId/participation ─────────────────────────────

test.serial('Participate in public contest: succeeds', async (t) => {
  if (!state.publicContestId) { return t.fail('No publicContestId') }

  const res = await userAgent
    .post(`/api/contests/${state.publicContestId}/participation`)
    .send({})

  t.is(res.status, 200)
  t.true(res.body.success)
})

test.serial('Participate in public contest: already participated returns error', async (t) => {
  if (!state.publicContestId) { return t.fail('No publicContestId') }

  const res = await userAgent
    .post(`/api/contests/${state.publicContestId}/participation`)
    .send({})

  t.is(res.status, 200)
  t.false(res.body.success)
  t.is(res.body.code, 400)
})

test.serial('Participate in future contest before start: succeeds', async (t) => {
  if (!state.futureContestId) { return t.fail('No futureContestId') }

  const res = await userAgent
    .post(`/api/contests/${state.futureContestId}/participation`)
    .send({})

  t.is(res.status, 200)
  t.true(res.body.success)
})

test.serial('Future contest detail remains inaccessible before start', async (t) => {
  if (!state.futureContestId) { return t.fail('No futureContestId') }

  const res = await userAgent.get(`/api/contests/${state.futureContestId}`)

  t.is(res.status, 200)
  t.false(res.body.success)
  t.is(res.body.code, 404)
})

test.serial('Future contest ranklist remains inaccessible before start', async (t) => {
  if (!state.futureContestId) { return t.fail('No futureContestId') }

  const res = await userAgent.get(`/api/contests/${state.futureContestId}/ranklist`)

  t.is(res.status, 200)
  t.false(res.body.success)
  t.is(res.body.code, 404)
})

test.serial('Future contest discussions remain inaccessible before start', async (t) => {
  if (!state.futureContestId) { return t.fail('No futureContestId') }

  const res = await userAgent.get(`/api/contests/${state.futureContestId}/discussions`)

  t.is(res.status, 200)
  t.false(res.body.success)
  t.is(res.body.code, 404)
})

test.serial('Participate in ended contest after finish: succeeds', async (t) => {
  if (!state.endedContestId) { return t.fail('No endedContestId') }

  const res = await userAgent
    .post(`/api/contests/${state.endedContestId}/participation`)
    .send({})

  t.is(res.status, 200)
  t.true(res.body.success)
})

test.serial('Ended contest detail is accessible after joining', async (t) => {
  if (!state.endedContestId) { return t.fail('No endedContestId') }

  const res = await userAgent.get(`/api/contests/${state.endedContestId}`)

  t.is(res.status, 200)
  t.true(res.body.success)
  t.is(res.body.data.contestId, state.endedContestId)
})

test.serial('Ended contest ranklist is accessible after joining', async (t) => {
  if (!state.endedContestId) { return t.fail('No endedContestId') }

  const res = await userAgent.get(`/api/contests/${state.endedContestId}/ranklist`)

  t.is(res.status, 200)
  t.true(res.body.success)
})

// ─── GET /api/contests/:contestId after participation ────────────────────────

test.serial('Get public contest detail after participation: accessible', async (t) => {
  if (!state.publicContestId) { return t.fail('No publicContestId') }

  const res = await userAgent.get(`/api/contests/${state.publicContestId}`)

  t.is(res.status, 200)
  t.true(res.body.success)
  t.is(res.body.data.contestId, state.publicContestId)
  t.false(res.body.data.isJury)
  t.true(Array.isArray(res.body.data.problems))
})

test.serial('Get contest detail without participation: access denied', async (t) => {
  if (!state.passwordContestId) { return t.fail('No passwordContestId') }

  const res = await userAgent.get(`/api/contests/${state.passwordContestId}`)

  t.is(res.status, 200)
  t.false(res.body.success)
  t.is(res.body.code, 404)
})

// ─── POST /api/contests/:contestId/participation (password contest) ──────────

test.serial('Participation status: password contest shows canParticipateByPassword', async (t) => {
  if (!state.passwordContestId) { return t.fail('No passwordContestId') }

  const res = await userAgent.get(`/api/contests/${state.passwordContestId}/participation`)

  t.is(res.status, 200)
  t.true(res.body.success)
  t.is(res.body.data.participation, ParticipationStatus.NotApplied)
  t.false(res.body.data.canParticipate)
  t.true(res.body.data.canParticipateByPassword)
})

test.serial('Participate with wrong password: forbidden', async (t) => {
  if (!state.passwordContestId) { return t.fail('No passwordContestId') }

  const res = await userAgent
    .post(`/api/contests/${state.passwordContestId}/participation`)
    .send({ password: 'wrongpassword' })

  t.is(res.status, 200)
  t.false(res.body.success)
  t.is(res.body.code, 403)
})

test.serial('Participate with correct password: succeeds', async (t) => {
  if (!state.passwordContestId) { return t.fail('No passwordContestId') }

  const res = await userAgent
    .post(`/api/contests/${state.passwordContestId}/participation`)
    .send({ password: 'secret123' })

  t.is(res.status, 200)
  t.true(res.body.success)
})

// ─── IP whitelist blocking ────────────────────────────────────────────────────

test.serial('Participation status: IP-blocked contest shows isIpBlocked=true', async (t) => {
  if (!state.ipBlockedContestId) { return t.fail('No ipBlockedContestId') }

  const res = await userAgent.get(`/api/contests/${state.ipBlockedContestId}/participation`)

  t.is(res.status, 200)
  t.true(res.body.success)
  t.true(res.body.data.isIpBlocked)
  t.false(res.body.data.canParticipate)
})

test.serial('Participate in IP-blocked contest: returns 403', async (t) => {
  if (!state.ipBlockedContestId) { return t.fail('No ipBlockedContestId') }

  const res = await userAgent
    .post(`/api/contests/${state.ipBlockedContestId}/participation`)
    .send({})

  t.is(res.status, 200)
  t.false(res.body.success)
  t.is(res.body.code, 403)
})

// ─── Config endpoint: non-jury cannot access ─────────────────────────────────

test.serial('Get contest config as non-jury returns 404', async (t) => {
  if (!state.publicContestId) { return t.fail('No publicContestId') }

  const res = await userAgent.get(`/api/contests/${state.publicContestId}/configs`)

  t.is(res.status, 200)
  t.false(res.body.success)
  t.is(res.body.code, 404)
})

test.serial('Update contest config as non-jury returns 404', async (t) => {
  if (!state.publicContestId) { return t.fail('No publicContestId') }

  const res = await userAgent
    .put(`/api/contests/${state.publicContestId}/configs`)
    .send({ title: 'Hacked Title' })

  t.is(res.status, 200)
  t.false(res.body.success)
  t.is(res.body.code, 404)
})

test.serial('List participants as non-jury returns 404', async (t) => {
  if (!state.publicContestId) { return t.fail('No publicContestId') }

  const res = await userAgent.get(`/api/contests/${state.publicContestId}/participants`)

  t.is(res.status, 200)
  t.false(res.body.success)
  t.is(res.body.code, 404)
})

test.serial('Update participant status as non-jury returns 404', async (t) => {
  if (!state.publicContestId) { return t.fail('No publicContestId') }

  const res = await userAgent
    .put(`/api/contests/${state.publicContestId}/participants/${user.uid}`)
    .send({ status: ParticipationStatus.Suspended })

  t.is(res.status, 200)
  t.false(res.body.success)
  t.is(res.body.code, 404)
})

// ─── Participation status: Approved after joining ────────────────────────────

test.serial('Participation status: Approved after joining public contest', async (t) => {
  if (!state.publicContestId) { return t.fail('No publicContestId') }

  const res = await userAgent.get(`/api/contests/${state.publicContestId}/participation`)

  t.is(res.status, 200)
  t.true(res.body.success)
  t.is(res.body.data.participation, ParticipationStatus.Approved)
})

test.serial('Suspended user cannot access contest detail or ranklist', async (t) => {
  if (!state.publicContestId) { return t.fail('No publicContestId') }

  const suspendRes = await adminAgent
    .put(`/api/contests/${state.publicContestId}/participants/${user.uid}`)
    .send({ status: ParticipationStatus.Suspended })
  t.true(suspendRes.body.success)

  const detailRes = await userAgent.get(`/api/contests/${state.publicContestId}`)
  t.false(detailRes.body.success)
  t.is(detailRes.body.code, 404)

  const ranklistRes = await userAgent.get(`/api/contests/${state.publicContestId}/ranklist`)
  t.false(ranklistRes.body.success)
  t.is(ranklistRes.body.code, 404)
})

test.serial('Restored user can access contest detail again', async (t) => {
  if (!state.publicContestId) { return t.fail('No publicContestId') }

  const restoreRes = await adminAgent
    .put(`/api/contests/${state.publicContestId}/participants/${user.uid}`)
    .send({ status: ParticipationStatus.Approved })
  t.true(restoreRes.body.success)

  const detailRes = await userAgent.get(`/api/contests/${state.publicContestId}`)
  t.true(detailRes.body.success)
  t.is(detailRes.body.data.contestId, state.publicContestId)
})

test.after.always('close server', () => {
  server.close()
})
