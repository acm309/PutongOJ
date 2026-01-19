import test from 'ava'
import supertest from 'supertest'
import app from '../../../src/app'

const server = app.listen()
const request = supertest.agent(server)

test.skip('Contest list', async (t) => {
  const res = await request
    .get('/api/contest/list')

  t.is(res.status, 200)
  t.is(res.type, 'application/json')
  t.truthy(Array.isArray(res.body.list.docs))

  if (res.body.list.docs.length > 0) {
    t.truthy(res.body.list.docs[0].title)
    t.truthy(res.body.list.docs[0].start)
    t.truthy(res.body.list.docs[0].end)
  }
})

test.skip('Search contest', async (t) => {
  const res = await request
    .get('/api/contest/list')
    .query({ type: 'title', content: '2' })

  t.is(res.status, 200)
  t.is(res.type, 'application/json')
  t.truthy(res.body.list.docs.length > 0)
  t.truthy(res.body.list.docs[0].title.includes('2'))
})

test.after.always('close server', () => {
  server.close()
})
