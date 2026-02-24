import test from 'ava'
import supertest from 'supertest'
import app from '../../../src/app'

const server = app.listen()
const request = supertest.agent(server)

test('Can not create solution without login', async (t) => {
  const res = await request
    .post('/api/status')
    .send({
      pid: 1000,
      language: 1,
      code: 'Anything you like',
    })

  t.is(res.status, 200)
  t.is(res.body.success, false)
  t.is(res.body.code, 401)
})

test.skip('Status list', async (t) => {
  const res = await request
    .get('/api/status/list')

  t.is(res.status, 200)
  t.true(Array.isArray(res.body.list.docs))

  t.truthy(res.body.list.docs[0].sid)

  // without code
  t.falsy(res.body.list.docs[0].code)
})

test('Can not see solution without login', async (t) => {
  const res = await request
    .get('/api/status/1')

  t.is(res.status, 200)
  t.is(res.body.success, false)
  t.is(res.body.code, 401)
})

test.after.always('close server', () => {
  server.close()
})
