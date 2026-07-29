import { resolve } from 'node:path'
import test from 'ava'
import supertest from 'supertest'
import app from '../../../src/app'

const server = app.listen()
const request = supertest.agent(server)

const filepath = resolve(__dirname, '../utils.test.ts')

test('Visitor cannot upload a file', async (t) => {
  const res = await request
    .post('/api/upload')
    .attach('image', filepath)

  t.is(res.status, 200)
  t.is(res.body.success, false)
  t.is(res.body.code, 401)
})

test('Visitor cannot list files', async (t) => {
  const res = await request
    .get('/api/files')

  t.is(res.status, 200)
  t.is(res.body.success, false)
  t.is(res.body.code, 401)
})

test('Visitor cannot delete a file', async (t) => {
  const res = await request
    .delete('/api/files/nonexistent-key')

  t.is(res.status, 200)
  t.is(res.body.success, false)
  t.is(res.body.code, 401)
})

test.after.always('close server', () => {
  server.close()
})
