const test = require('ava')
const supertest = require('supertest')
const only = require('only')
const app = require('../../../app')
const discuss = require('../../seed/discuss')

const server = app.listen()
const request = supertest.agent(server)

test('Discuss list', async (t) => {
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

test('Find Discuss 1', async (t) => {
  const res = await request
    .get('/api/discuss/1')

  t.is(res.status, 200)
  t.is(res.type, 'application/json')

  const select = discuss.data.find(item => item.title === res.body.discuss.title)
  const com = res.body.discuss.comments

  t.deepEqual(only(res.body.discuss, 'create title uid create update'), only(select, 'create title uid create update'))
  com.forEach((item, index) => {
    t.deepEqual(only(item, 'content create uid'), select.comments[index])
  })
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
      title: 'test',
    })

  t.is(res.status, 401)
  t.is(res.type, 'application/json')

  t.truthy(res.body.error)
})

test.after.always('close server', () => {
  server.close()
})
