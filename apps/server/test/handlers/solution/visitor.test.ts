import { Language } from '@putongoj/shared'
import test from 'ava'
import supertest from 'supertest'
import app from '../../../src/app'

const server = app.listen()
const request = supertest.agent(server)

test('Can not create solution without login', async (t) => {
  const res = await request
    .post('/api/submissions')
    .send({
      problemId: 1000,
      language: Language.C,
      sourceCode: 'Anything you like',
    })

  t.is(res.status, 200)
  t.is(res.body.success, false)
  t.is(res.body.code, 401)
})

test.skip('Status list', async (t) => {
  const res = await request
    .get('/api/submissions/list')

  t.is(res.status, 200)
  t.true(Array.isArray(res.body.list.items))

  t.truthy(res.body.list.items[0].id)

  // without code
  t.falsy(res.body.list.items[0].sourceCode)
})

test('Can not see solution without login', async (t) => {
  const res = await request
    .get('/api/submissions/1')

  t.is(res.status, 200)
  t.is(res.body.success, false)
  t.is(res.body.code, 401)
})

test.after.always('close server', () => {
  server.close()
})
