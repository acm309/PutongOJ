const test = require('ava')
const supertest = require('supertest')
const app = require('../../../src/app')

const server = app.listen()
const request = supertest.agent(server)

test.skip('Tag list', async (t) => {
  const list = await request
    .get('/api/tag/list')

  t.is(list.status, 200)
  t.is(list.type, 'application/json')
  t.truthy(Array.isArray(list.body.list))
})

test.skip('Tag find one', async (t) => {
  const list = await request
    .get('/api/tag/level1')

  t.is(list.status, 200)
  t.is(list.type, 'application/json')
})

test.skip('Fails to create a tag -- no permission', async (t) => {
  const create = await request
    .post('/api/tag')
    .send({
      tid: '12345',
      list: [ 1001 ],
    })

  t.is(create.status, 401)
  t.truthy(create.body.error)
})

test.after.always('close server', () => {
  server.close()
})
