import test from 'ava'
import supertest from 'supertest'
import app from '../../../src/app'
import config from '../../../src/config'
import { encryptData } from '../../../src/services/crypto'

const server = app.listen()
const request = supertest.agent(server)

test.before('Login', async (t) => {
  const login = await request
    .post('/api/account/login')
    .send({
      username: 'admin',
      password: await encryptData(config.deploy.adminInitPwd),
    })

  t.is(login.status, 200)
})

let newCid: number | null = null

test.serial.skip('Create a contest', async (t) => {
  const start = Date.now()
  const end = Date.now() + 5 * 60 * 60 * 1000
  const res = await request
    .post('/api/contest')
    .send({
      title: 'Today',
      list: [ 1000, 1001 ],
      start,
      end,
    })

  t.is(res.status, 200)

  newCid = res.body.cid

  const find = await request
    .get(`/api/contest/${newCid}`)

  t.is(find.status, 200)
  t.deepEqual(find.body.contest.list, [ 1000, 1001 ])
  t.is(find.body.contest.start, start)
  t.is(find.body.contest.end, end)
})

test.serial.skip('Update a contest', async (t) => {
  const start = Date.now()
  const end = Date.now() + 5 * 60 * 60 * 1000
  const res = await request
    .put(`/api/contest/${newCid}`)
    .send({
      title: 'yesterday',
      list: [ 1000 ],
      start,
      end,
    })

  t.is(res.status, 200)

  const find = await request
    .get(`/api/contest/${newCid}`)

  t.is(find.status, 200)
  t.deepEqual(find.body.contest.title, 'yesterday')
  t.deepEqual(find.body.contest.list, [ 1000 ])
  t.is(find.body.contest.start, start)
  t.is(find.body.contest.end, end)
})

test.serial.skip('Can not create a contest', async (t) => {
  const start = Date.now()
  const end = Date.now() + 5 * 60 * 60 * 1000
  const res = await request
    .post('/api/contest')
    .send({
      title: 'Today',
      list: 'abc',
      start,
      end,
    })

  t.is(res.status, 400)
  t.is(res.type, 'application/json')

  t.truthy(res.body.error)
})

test.serial.skip('Can not update a contest', async (t) => {
  const start = Date.now()
  const end = Date.now() + 5 * 60 * 60 * 1000
  const res = await request
    .put(`/api/contest/${newCid}`)
    .send({
      title: [ 'yesterday' ],
      list: 'abc',
      start,
      end,
    })

  t.is(res.status, 400)
  t.is(res.type, 'application/json')

  t.truthy(res.body.error)
})

test.serial.skip('Delete a contest', async (t) => {
  const del = await request
    .del(`/api/contest/${newCid}`)

  t.is(del.status, 200)
})

test.skip('The length of contest title should not be greater than 80', async (t) => {
  const start = Date.now()
  const end = Date.now() + 5 * 60 * 60 * 1000
  const res = await request
    .post('/api/contest')
    .send({
      title: 'Today node "/Users/kepeilin/Documents/web-projects/PutongOJ/controllers/contest.js" and no hao chaduoshao ndk',
      list: [ 1000, 1001 ],
      start,
      end,
    })

  t.is(res.status, 400)
  t.is(res.type, 'application/json')

  t.truthy(res.body.error)
})

test.skip('The contest end time can not be earlier than the start time', async (t) => {
  const start = Date.now() + 5 * 60 * 60 * 1000
  const end = Date.now()
  const res = await request
    .post('/api/contest')
    .send({
      title: 'Today',
      list: [ 1000, 1001 ],
      start,
      end,
    })

  t.is(res.status, 400)
  t.is(res.type, 'application/json')

  t.truthy(res.body.error)
})

test.skip('Some field is required to create a contest', async (t) => {
  const res = await request
    .post('/api/contest')
    .send({})

  t.is(res.status, 400)
  t.is(res.type, 'application/json')

  t.truthy(res.body.error)
})

test.after.always('close server', () => {
  server.close()
})
