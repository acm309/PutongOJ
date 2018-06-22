const test = require('ava')
const supertest = require('supertest')
const app = require('../../../app')
const discussSeeds = require('../../seed/discuss')

const server = app.listen()
const request = supertest.agent(server)

test('Discuss list', async t => {
  const res = await request
    .get('/api/discuss/list')

  t.is(res.status, 200)
  t.is(res.type, 'application/json')
  t.truthy(Array.isArray(res.body.list))
  res.body.list.forEach((item) => {
    t.truthy(item.title)
    t.truthy(item.uid)
    t.truthy(item.update)
  })
})

test('Find Discuss 1', async t => {
  const res = await request
    .get('/api/discuss/1')

  t.is(res.status, 200)
  const { discuss } = res.body
  t.is(discuss.title, discussSeeds.data[0].title)
  t.is(discuss.uid, discussSeeds.data[0].uid)
})

test('Discuss should fail to find one', async (t) => {
  const res = await request
    .get('/api/discuss/10000')

  t.is(res.status, 400)
  t.is(res.type, 'application/json')

  t.truthy(res.body.error)
})

test('Did is not a number', async (t) => {
  const res = await request
    .get('/api/discuss/xx')

  t.is(res.status, 400)
  t.is(res.type, 'application/json')

  t.truthy(res.body.error)
})

test('Login required to create one', async (t) => {
  const res = await request
    .post('/api/discuss')
    .send({
      title: 'test'
    })

  t.is(res.status, 401)
  t.is(res.type, 'application/json')

  t.truthy(res.body.error)
})

test.after.always('close server', t => {
  server.close()
})
