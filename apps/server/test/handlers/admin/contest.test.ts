import test from 'ava'
import supertest from 'supertest'
import app from '../../../src/app'
import { encryptData } from '../../../src/services/crypto'
import { deploy } from '../../../src/utils/constants'
import { userSeeds } from '../../seeds/user'

const server = app.listen()
const adminAgent = supertest.agent(server)
const userAgent = supertest.agent(server)

const now = Date.now()
const baseContest = {
  startsAt: new Date(now - 60_000).toISOString(),
  endsAt: new Date(now + 60 * 60_000).toISOString(),
  isHidden: false,
  isPublic: true,
}

const state = {
  publicContestId: 0,
  hiddenContestId: 0,
  courseContestId: 0,
}

test.before('Log in and create contests for administration', async (t) => {
  const adminLogin = await adminAgent.post('/api/account/login').send({
    username: 'admin',
    password: await encryptData(deploy.adminInitPwd),
  })
  t.true(adminLogin.body.success)

  const userLogin = await userAgent.post('/api/account/login').send({
    username: userSeeds.primaryuser.uid,
    password: await encryptData(userSeeds.primaryuser.pwd!),
  })
  t.true(userLogin.body.success)

  const [ publicContest, hiddenContest, courseContest ] = await Promise.all([
    adminAgent.post('/api/contests').send({ ...baseContest, title: 'Admin List Public Contest' }),
    adminAgent.post('/api/contests').send({ ...baseContest, title: 'Admin List Hidden Contest', isHidden: true }),
    adminAgent.post('/api/contests').send({ ...baseContest, title: 'Admin List Course Contest', course: 1 }),
  ])
  t.true(publicContest.body.success)
  t.true(hiddenContest.body.success)
  t.true(courseContest.body.success)

  state.publicContestId = publicContest.body.data.contestId
  state.hiddenContestId = hiddenContest.body.data.contestId
  state.courseContestId = courseContest.body.data.contestId
})

test.serial('Admin list includes hidden and course contests', async (t) => {
  const res = await adminAgent.get('/api/admin/contests').query({ title: 'Admin List' })

  t.is(res.status, 200)
  t.true(res.body.success)
  t.true(res.body.data.docs.some((contest: any) => contest.contestId === state.publicContestId))
  t.true(res.body.data.docs.some((contest: any) => contest.contestId === state.hiddenContestId))
  const courseContest = res.body.data.docs.find((contest: any) => contest.contestId === state.courseContestId)
  t.truthy(courseContest)
  t.is(courseContest.course.courseId, 1)
  t.is(courseContest.course.name, 'Java Basics')
})

test.serial('Admin list filters by visibility and course association', async (t) => {
  const hidden = await adminAgent.get('/api/admin/contests').query({ contestId: state.hiddenContestId, isHidden: true })
  t.true(hidden.body.success)
  t.is(hidden.body.data.total, 1)
  t.true(hidden.body.data.docs[0].isHidden)

  const noCourse = await adminAgent.get('/api/admin/contests').query({ contestId: state.publicContestId, course: -1 })
  t.true(noCourse.body.success)
  t.is(noCourse.body.data.total, 1)
  t.is(noCourse.body.data.docs[0].course, null)

  const course = await adminAgent.get('/api/admin/contests').query({ contestId: state.courseContestId, course: 1 })
  t.true(course.body.success)
  t.is(course.body.data.total, 1)
  t.is(course.body.data.docs[0].course.courseId, 1)
})

test.serial('Non-admin cannot access the admin contest list', async (t) => {
  const res = await userAgent.get('/api/admin/contests')

  t.is(res.status, 200)
  t.false(res.body.success)
  t.is(res.body.code, 403)
})

test.after.always('Close server', () => {
  server.close()
})
