const test = require('ava')
const supertest = require('supertest')
const app = require('../../app')

const server = app.listen()
const request = supertest.agent(server)

test.before(async t => {
  const res = await request
    .post('/api/session')
    .send({
      uid: 'primaryuser',
      pwd: '123'
    })
  t.is(res.status, 200)
})

test('Status list', async t => {
  const res = await request
    .get('/api/status/list')

  t.plan(4)

  t.is(res.status, 200)
  t.is(res.type, 'application/json')
  t.true(Array.isArray(res.body.list.docs))

  if (res.body.list.length > 0) {
    t.truthy(res.body.list.docs[0].sid)

    // without code
    t.falsy(res.body.list.docs[0].code)
  } else {
    t.pass('Status list is empty')
  }
})

test('Status fails to find one', async (t) => {
  const res = await request
    .get('/api/status/-1')

  t.is(res.status, 400)
  t.is(res.type, 'application/json')

  t.truthy(res.body.error)
})

test('Status fails to delete', async t => {
  const res = await request
    .del('/api/status/1000')

  t.is(res.status, 405)
})

test('Status fails to update', async t => {
  const res = await request
    .put('/api/status/1000')

  t.is(res.status, 405)
})

test.after.always('close server', t => {
  server.close()
})

test.serial('Submit a solution', async t => {
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
      language: 2 // cpp; TODO: as a constant
    })

  t.is(res.status, 200)
  t.deepEqual(res.body, {})

  res = await request.get('/api/status/1')

  t.is(res.status, 200)
  t.is(res.body.solution.code, code)
})
