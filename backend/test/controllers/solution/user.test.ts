import { Language } from '@putongoj/shared'
import test from 'ava'
import supertest from 'supertest'
import app from '../../../src/app'
import { encryptData } from '../../../src/services/crypto'
import { userSeeds } from '../../seeds/user'

const server = app.listen()
const request = supertest.agent(server)

let sid = null

test.before(async (t) => {
  const res = await request
    .post('/api/account/login')
    .send({
      username: 'primaryuser',
      password: await encryptData(userSeeds.primaryuser.pwd!),
    })
  t.is(res.status, 200)
})

test.serial('Submit a solution', async (t) => {
  const code = `
    #include <iostream>

    using namespace std;

    int main () {
      return 0;
    }
  `
  let res = await request
    .post('/api/status/')
    .send({
      problem: 1000,
      code,
      language: Language.Cpp17,
    })

  t.is(res.status, 200)
  t.true(res.body.success)
  sid = res.body.data.solution

  res = await request.get(`/api/status/${sid}`)

  t.is(res.status, 200)
  t.is(res.body.solution.code, code)
})

test('Status fails to find one', async (t) => {
  const res = await request
    .get('/api/status/87654321')

  t.is(res.status, 200)
  t.is(res.body.success, false)
  t.is(res.body.code, 400)
})

test('Status fails to delete', async (t) => {
  const res = await request
    .del('/api/status/1000')

  t.is(res.status, 405)
})

test('Status fails to update', async (t) => {
  const res = await request
    .put('/api/status/1000')

  t.is(res.status, 200)
  t.is(res.body.success, false)
  t.is(res.body.code, 403)
})

test('Can not see solution of another user', async (t) => {
  const res = await request
    .get('/api/status/1')

  t.is(res.status, 200)
  t.is(res.body.success, false)
  t.is(res.body.code, 403)
})

test('Code is too long', async (t) => {
  const code = `
    #include <iostream>

    using namespace std;

    int main () {
      "${'a'.repeat(20000)}";
      return 0;
    }
  `
  const res = await request
    .post('/api/status/')
    .send({
      problem: 1000,
      code,
      language: Language.Cpp17,
    })

  t.is(res.status, 200)
  t.is(res.body.success, false)
  t.is(res.body.code, 400)
})

test('Code is too short', async (t) => {
  const code = '1;'
  const res = await request
    .post('/api/status/')
    .send({
      problem: 1000,
      code,
      language: Language.Cpp17,
    })

  t.is(res.status, 200)
  t.is(res.body.success, false)
  t.is(res.body.code, 400)
})

test.after.always('close server', () => {
  server.close()
})
