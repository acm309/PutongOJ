import test from 'ava'
import supertest from 'supertest'
import app from '../../../src/app.ts'

const server = app.listen()
const request = supertest.agent(server)

test('Group list', async (t) => {
  const res = await request
    .get('/api/group')

  t.is(res.status, 200)
  t.true(res.body.success)
  t.truthy(Array.isArray(res.body.data))

  const item = res.body.data[0]
  t.is(typeof item.id, 'string')
  t.regex(item.id, /^[0-9a-f]{24}$/i)
  t.is(typeof item.title, 'string')
})

test.after.always('close server', () => {
  server.close()
})
