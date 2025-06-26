const test = require('ava')
const supertest = require('supertest')
const app = require('../../src/app')

const server = app.listen()
const request = supertest.agent(server)

test('Fetch ranklist', async (t) => {
  const res = await request
    .get('/api/ranklist/list')

  t.is(res.status, 200)
  t.truthy(res.body.list)

  const list = res.body.list
  for (let i = 1; i < list.length; i++) {
    if (list[i].solve > list[i - 1].solve && list[i].submit < list[i - 1].submit) {
      t.fail('ranklist is not correctly sorted')
    }
  }
})

test('Fetch ranklist filtered by group', async (t) => {
  const res = await request
    .get('/api/ranklist/list?gid=1')

  t.is(res.status, 200)
  t.truthy(res.body.list)
})
