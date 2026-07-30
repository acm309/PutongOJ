import test from 'ava'
import { getDatabase } from '../../src/config/postgres'
import { contestService } from '../../src/services/contest'
import { userSeeds } from '../seeds/user'

const context: { contestId?: number, userId?: number } = {}
const now = Date.now()
const contestInput = {
  title: 'Service Test Contest',
  startsAt: new Date(now - 60_000),
  endsAt: new Date(now + 60 * 60_000),
  isHidden: false,
  isPublic: true,
  courseId: null,
}

test.serial('creates, gets, lists, and updates contests', async (t) => {
  const contest = await contestService.createContest(contestInput)
  context.contestId = contest.id
  t.true(contest.id > 0)
  t.is(contest.title, contestInput.title)

  const loaded = await contestService.getContest(contest.id)
  t.is(loaded?.id, contest.id)
  const listed = await contestService.findContests(
    { page: 1, pageSize: 10, sort: 'desc', sortBy: 'createdAt' }, {}, true,
  )
  t.true(listed.items.some(item => item.id === contest.id))

  t.true(await contestService.updateContest(contest.id, { title: 'Updated Service Contest' }))
  t.is((await contestService.getContest(contest.id))?.title, 'Updated Service Contest')
  t.false(await contestService.updateContest(999_999, { title: 'Missing' }))
})

test.serial('enforces distinct contest problems and manages participation', async (t) => {
  const contestId = context.contestId
  if (!contestId) { return t.fail('contest not created') }
  const database = await getDatabase()
  const user = await database.user.findUnique({ where: { username: userSeeds.primaryuser.username } })
  if (!user) { return t.fail('seed user not found') }
  context.userId = user.id

  t.is(await contestService.getParticipation(user.id, contestId), 'NOT_APPLIED')
  await contestService.updateParticipation(user.id, contestId, 'APPROVED')
  t.is(await contestService.getParticipation(user.id, contestId), 'APPROVED')
  await contestService.updateParticipation(user.id, contestId, 'NOT_APPLIED')
  t.is(await contestService.getParticipation(user.id, contestId), 'NOT_APPLIED')

  t.true(await contestService.updateContest(contestId, { problemIds: [ 1000, 1001 ] }))
  t.false(await contestService.updateContest(contestId, { problemIds: [ 1000, 1000 ] }))
  const contest = await contestService.getContest(contestId)
  t.deepEqual(contest?.problems.map(problem => problem.problemId), [ 1000, 1001 ])
})
