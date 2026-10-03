import { Contest, Problem, Solution, User } from '@putong-oj/db'
import { JudgeStatus, ParticipationStatus } from '@putong-oj/shared'
import test from 'ava'
import { CacheKey, cacheService } from '../../src/services/cache.ts'
import { contestService } from '../../src/services/contest.ts'
import { userSeeds } from '../seeds/user.ts'
import '../../src/config/db.ts'

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
  )

  t.truthy(result)
  t.true(result.docs.every(c => c.title.includes('Service Test')))
})

test.serial('findContests: title filter that matches nothing returns empty docs', async (t) => {
  const result = await contestService.findContests(
    { page: 1, pageSize: 10, sort: -1, sortBy: 'createdAt' },
    { title: 'THIS_SHOULD_NEVER_MATCH_XYZ_999' },
  )

  t.is(result.total, 0)
  t.is(result.docs.length, 0)
})

test.serial('findContests: applies the explicit hidden-contest filter', async (t) => {
  // Create a hidden public contest
  const hidden = await contestService.createContest({
    ...testContest,
    title: 'Hidden Service Contest',
    isHidden: true,
  })

  const visibleResult = await contestService.findContests(
    { page: 1, pageSize: 50, sort: -1, sortBy: 'createdAt' },
    { isHidden: { $ne: true } },
  )

  t.false(visibleResult.docs.some(c => c.contestId === hidden.contestId))

  const allResult = await contestService.findContests(
    { page: 1, pageSize: 50, sort: -1, sortBy: 'createdAt' },
    {},
  )

  t.true(allResult.docs.some(c => c.contestId === hidden.contestId))

  // Clean up
  await Contest.deleteOne({ contestId: hidden.contestId })
})

// ─── getProblemsWithStats ────────────────────────────────────────────────────

test.serial('getProblemsWithStats: counts distinct submitters and solvers', async (t) => {
  const problem = await Problem.findOne({ pid: 1000 }).lean()
  if (!problem) { return t.fail('Problem 1000 not in DB') }

  const contest = await contestService.createContest({
    ...testContest,
    title: 'Stats Test Contest',
  })
  await contestService.updateContest(contest.contestId, { problems: [ problem._id ] })

  const primary = await User.findOne({ uid: userSeeds.primaryuser.uid }).lean()
  const accepter = await User.findOne({ uid: userSeeds.ugordon.uid }).lean()
  const failer = await User.findOne({ uid: userSeeds.kevin63.uid }).lean()
  if (!primary || !accepter || !failer) { return t.fail('Seed users missing') }

  const makeSolution = (user: { _id: any }, judge: JudgeStatus) => ({
    contest: contest._id,
    problem: problem._id,
    user: user._id,
    judge,
    language: 2,
    length: 12,
    code: 'int main(){}',
  })

  await Solution.create([
    makeSolution(primary, JudgeStatus.Accepted),
    makeSolution(accepter, JudgeStatus.Accepted),
    makeSolution(failer, JudgeStatus.WrongAnswer),
  ])

  const stats = await contestService.getProblemsWithStats(contest._id, false)
  t.is(stats.length, 1)
  t.is(stats[0].problemId, 1000)
  t.is(stats[0].index, 1)
  // submit counts distinct submitters, solve counts distinct users with an Accepted solution
  t.is(stats[0].submit, 3)
  t.is(stats[0].solve, 2)

  await Solution.deleteMany({ contest: contest._id })
  await cacheService.remove(CacheKey.contestProblems(contest._id, false))
  await Contest.deleteOne({ contestId: contest.contestId })
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

test.serial('findParticipants: returns approved participant records', async (t) => {
  const userId = ctx.userObjectId
  const contestObjectId = ctx.contestObjectId
  if (!userId || !contestObjectId) { return t.fail('Missing user/contest ObjectId') }

  await contestService.updateParticipation(userId, contestObjectId, ParticipationStatus.Approved)

  const result = await contestService.findParticipants(
    contestObjectId,
    { page: 1, pageSize: 10, sort: -1, sortBy: 'updatedAt' },
    { status: ParticipationStatus.Approved },
  )

  t.true(result.total >= 1)
  t.true(result.docs.some(doc => doc.username === userSeeds.primaryuser.uid))
})

test.serial('findParticipants: user filter narrows results', async (t) => {
  const contestObjectId = ctx.contestObjectId
  if (!contestObjectId) { return t.fail('Missing contest ObjectId') }

  const result = await contestService.findParticipants(
    contestObjectId,
    { page: 1, pageSize: 10, sort: -1, sortBy: 'updatedAt' },
    { user: 'primary', status: ParticipationStatus.Approved },
  )

  t.true(result.docs.every(doc => doc.username.includes('primary') || doc.nickname.includes('primary')))
})

test.serial('updateParticipantStatus: updates existing record only', async (t) => {
  const userId = ctx.userObjectId
  const contestObjectId = ctx.contestObjectId
  if (!userId || !contestObjectId) { return t.fail('Missing user/contest ObjectId') }

  const updated = await contestService.updateParticipantStatus(
    userId,
    contestObjectId,
    ParticipationStatus.Suspended,
  )

  t.true(updated)
  t.is(
    await contestService.getParticipation(userId, contestObjectId),
    ParticipationStatus.Suspended,
  )
})
