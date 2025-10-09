import test from 'ava'
import supertest from 'supertest'
import app from '../../src/app'

const server = app.listen()
const request = supertest.agent(server)

test('Fetch ranklist', async (t) => {
  const res = await request
    .get('/api/user/ranklist')

  t.is(res.status, 200)
  t.true(res.body.success)
  t.truthy(res.body.data.docs)

  const list = res.body.data.docs
  for (let i = 1; i < list.length; i++) {
    if (
      list[i].solve > list[i - 1].solve
      || (
        list[i].solve === list[i - 1].solve
        && list[i].submit < list[i - 1].submit
      )
    ) {
      t.fail('ranklist is not correctly sorted')
    }
  }
})

test('Fetch ranklist filtered by group', async (t) => {
  const res = await request
    .get('/api/user/ranklist?group=1')

  t.is(res.status, 200)
  t.true(res.body.success)
  t.truthy(res.body.data.docs)
})
