import { ParticipationStatus } from '@putongoj/shared'
import test from 'ava'
import Contest from '../../src/models/Contest'
import User from '../../src/models/User'
import { contestService } from '../../src/services/contest'
import { userSeeds } from '../seeds/user'
import '../../src/models/Course'
import '../../src/config/db'

// ─── shared state ────────────────────────────────────────────────────────────

const ctx = {
  contestId: undefined as number | undefined,
  contestObjectId: undefined as any | undefined,
  userObjectId: undefined as any | undefined,
}

const now = Date.now()
const testContest = {
  title: 'Service Test Contest',
  startsAt: new Date(now - 60_000),
  endsAt: new Date(now + 60 * 60_000),
  isHidden: false,
  isPublic: true,
  course: null,
}

// ─── createContest ───────────────────────────────────────────────────────────

test.serial('createContest: creates a contest and returns it', async (t) => {
  const contest = await contestService.createContest(testContest)

  t.truthy(contest)
  t.is(typeof contest.contestId, 'number')
  t.true(contest.contestId > 0)
  t.is(contest.title, testContest.title)
  t.is(contest.isPublic, testContest.isPublic)
  t.is(contest.isHidden, testContest.isHidden)

  ctx.contestId = contest.contestId
  ctx.contestObjectId = contest._id
})

test.serial('createContest: endsAt before startsAt throws', async (t) => {
  await t.throwsAsync(() => contestService.createContest({
    ...testContest,
    title: 'Invalid Time Contest',
    startsAt: new Date(now + 60_000),
    endsAt: new Date(now),
  }))
})

// ─── getContest ──────────────────────────────────────────────────────────────

test.serial('getContest: returns the contest by contestId', async (t) => {
  const contestId = ctx.contestId
  if (!contestId) { return t.fail('No contestId from prior test') }

  const contest = await contestService.getContest(contestId)

  t.truthy(contest)
  t.is(contest?.contestId, contestId)
  t.is(contest?.title, testContest.title)
})

test('getContest: returns null for non-existent contestId', async (t) => {
  const contest = await contestService.getContest(0)
  t.is(contest, null)
})

// ─── findContests ────────────────────────────────────────────────────────────

test.serial('findContests: returns paginated results', async (t) => {
  const result = await contestService.findContests(
    { page: 1, pageSize: 10, sort: -1, sortBy: 'createdAt' },
    {},
    true,
  )

  t.truthy(result)
  t.true(result.total >= 1)
  t.true(Array.isArray(result.docs))
  t.true(result.docs.some(c => c.contestId === ctx.contestId))
})

test.serial('findContests: title filter narrows results', async (t) => {
  const result = await contestService.findContests(
    { page: 1, pageSize: 10, sort: -1, sortBy: 'createdAt' },
    { title: 'Service Test' },
    true,
  )

  t.truthy(result)
  t.true(result.docs.every(c => c.title.includes('Service Test')))
})

test.serial('findContests: title filter that matches nothing returns empty docs', async (t) => {
  const result = await contestService.findContests(
    { page: 1, pageSize: 10, sort: -1, sortBy: 'createdAt' },
    { title: 'THIS_SHOULD_NEVER_MATCH_XYZ_999' },
    true,
  )

  t.is(result.total, 0)
  t.is(result.docs.length, 0)
})

test.serial('findContests: showHidden=false excludes hidden contests', async (t) => {
  // Create a hidden public contest
  const hidden = await contestService.createContest({
    ...testContest,
    title: 'Hidden Service Contest',
    isHidden: true,
  })

  const visibleResult = await contestService.findContests(
    { page: 1, pageSize: 50, sort: -1, sortBy: 'createdAt' },
    {},
    false, // showHidden = false
  )

  t.false(visibleResult.docs.some(c => c.contestId === hidden.contestId))

  const hiddenResult = await contestService.findContests(
    { page: 1, pageSize: 50, sort: -1, sortBy: 'createdAt' },
    {},
    true, // showHidden = true
  )

  t.true(hiddenResult.docs.some(c => c.contestId === hidden.contestId))

  // Clean up
  await Contest.deleteOne({ contestId: hidden.contestId })
})

// ─── updateContest ───────────────────────────────────────────────────────────

test.serial('updateContest: updates title and returns true', async (t) => {
  const contestId = ctx.contestId
  if (!contestId) { return t.fail('No contestId from prior test') }

  const updated = await contestService.updateContest(contestId, { title: 'Updated Title' })
  t.true(updated)

  const contest = await contestService.getContest(contestId)
  t.is(contest?.title, 'Updated Title')
})

test('updateContest: returns false for non-existent contestId', async (t) => {
  const updated = await contestService.updateContest(0, { title: 'Ghost' })
  t.false(updated)
})

// ─── getParticipation / updateParticipation ───────────────────────────────────

test.serial('getParticipation: returns NotApplied when no record exists', async (t) => {
  // Find a user from seeds
  const user = await User.findOne({ uid: userSeeds.primaryuser.uid }).lean()
  if (!user) { return t.fail('primaryuser not in DB') }
  ctx.userObjectId = user._id

  const contestObjectId = ctx.contestObjectId
  if (!contestObjectId) { return t.fail('No contestObjectId from prior test') }

  const status = await contestService.getParticipation(user._id, contestObjectId)
  t.is(status, ParticipationStatus.NotApplied)
})

test.serial('updateParticipation: upserts and getParticipation reflects new status', async (t) => {
  const userId = ctx.userObjectId
  const contestObjectId = ctx.contestObjectId
  if (!userId || !contestObjectId) { return t.fail('Missing user/contest ObjectId') }

  await contestService.updateParticipation(userId, contestObjectId, ParticipationStatus.Approved)

  const status = await contestService.getParticipation(userId, contestObjectId)
  t.is(status, ParticipationStatus.Approved)
})

test.serial('updateParticipation: can update status again (idempotent upsert)', async (t) => {
  const userId = ctx.userObjectId
  const contestObjectId = ctx.contestObjectId
  if (!userId || !contestObjectId) { return t.fail('Missing user/contest ObjectId') }

  await contestService.updateParticipation(userId, contestObjectId, ParticipationStatus.NotApplied)

  const status = await contestService.getParticipation(userId, contestObjectId)
  t.is(status, ParticipationStatus.NotApplied)
})
