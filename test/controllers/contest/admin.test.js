const test = require('ava')
const supertest = require('supertest')
const app = require('../../../app')
const config = require('../../../config')

const server = app.listen()
const request = supertest.agent(server)

test.before('Login', async t => {
  const login = await request
    .post('/api/session')
    .send({
      uid: 'admin',
      pwd: config.deploy.adminInitPwd
    })

  t.is(login.status, 200)
})

let newCid = null

test.serial('Create a contest', async t => {
  const start = Date.now()
  const end = Date.now() + 5 * 60 * 60 * 1000
  const res = await request
    .post('/api/contest')
    .send({
      title: 'Today',
      list: [ 1000, 1001 ],
      start,
      end
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

test.serial('Update a contest', async t => {
  const start = Date.now()
  const end = Date.now() + 5 * 60 * 60 * 1000
  const res = await request
    .put(`/api/contest/${newCid}`)
    .send({
      title: 'yesterday',
      list: [ 1000 ],
      start,
      end
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

test.after.always('close server', t => {
  server.close()
})
