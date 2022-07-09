const test = require('ava')
const supertest = require('supertest')
const app = require('../../../app')
const users = require('../../seed/users')

const server = app.listen()
const request = supertest.agent(server)

let sid = null

test.before(async (t) => {
  const res = await request
    .post('/api/session')
    .send({
      uid: 'primaryuser',
      pwd: users.data.primaryuser.pwd,
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
      pid: 1000,
      uid: 'primaryuser',
      code,
      language: 2, // cpp; TODO: as a constant
    })

  sid = res.body.sid

  t.is(res.status, 200)

  res = await request.get(`/api/status/${sid}`)

  t.is(res.status, 200)
  t.is(res.body.solution.code, code)
})

test('Status fails to find one', async (t) => {
  const res = await request
    .get('/api/status/87654321')

  t.is(res.status, 400)
  t.is(res.type, 'application/json')

  t.truthy(res.body.error)
})

test('Status fails to delete', async (t) => {
  const res = await request
    .del('/api/status/1000')

  t.is(res.status, 405)
})

test('Status fails to update', async (t) => {
  const res = await request
    .put('/api/status/1000')

  t.is(res.status, 405)
})

test('Can not see solution of another user', async (t) => {
  const res = await request
    .get('/api/status/1')

  t.is(res.status, 403)
})

test('Code is too long', async (t) => {
  const code = `
    #include <iostream>

    using namespace std;

    int main () {
      "${'a'.repeat(10000)}";
      return 0;
    }
  `
  const res = await request
    .post('/api/status/')
    .send({
      pid: 1000,
      uid: 'primaryuser',
      code,
      language: 2, // cpp; TODO: as a constant
    })

  t.is(res.status, 400)
  t.is(res.type, 'application/json')

  t.truthy(res.body.error)
})

test('Code is too short', async (t) => {
  const code = '1;'
  const res = await request
    .post('/api/status/')
    .send({
      pid: 1000,
      uid: 'primaryuser',
      code,
      language: 2, // cpp; TODO: as a constant
    })

  t.is(res.status, 400)
  t.is(res.type, 'application/json')

  t.truthy(res.body.error)
})

test.after.always('close server', () => {
  server.close()
})
