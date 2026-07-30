import test from 'ava'
import supertest from 'supertest'
import app from '../../../src/app'
import { problemSeeds } from '../../seeds/problem'

const server = app.listen()
const request = supertest.agent(server)

test('Problem list', async (t) => {
  const res = await request
    .get('/api/problems')

  t.is(res.status, 200)
  t.true(res.body.success)
  t.truthy(Array.isArray(res.body.data.items))
  t.truthy(Array.isArray(res.body.data.solvedProblemIds))

  if (res.body.data.items.length > 0) {
    t.truthy(res.body.data.items[0].title)
    t.truthy(res.body.data.items[0].id)
  }
})

test('Problem list accepts ID search field without a search term', async (t) => {
  const res = await request
    .get('/api/problems?page=1&pageSize=30&searchField=id')

  t.is(res.status, 200)
  t.true(res.body.success)
  t.truthy(Array.isArray(res.body.data.items))
})

test('Problem find one', async (t) => {
  const res = await request.get('/api/problems/1001')

  t.is(res.status, 200)
  t.true(res.body.success)
  t.is(res.body.data.id, 1001)
  t.is(res.body.data.title, problemSeeds[1]!.title)
  t.is(res.body.data.description, problemSeeds[1]!.description)
  t.is(res.body.data.inputFormat, problemSeeds[1]!.input)
  t.is(res.body.data.outputFormat, problemSeeds[1]!.output)
  t.is(res.body.data.sampleInput, problemSeeds[1]!.in)
  t.is(res.body.data.sampleOutput, problemSeeds[1]!.out)
})

test('Problem should fail to find one', async (t) => {
  const res = await request
    .get('/api/problems/10000')

  t.is(res.status, 200)
  t.is(res.body.success, false)
  t.is(res.body.code, 404)
})

test('Pid is not a number', async (t) => {
  const res = await request
    .get('/api/problems/xx')

  t.is(res.status, 200)
  t.is(res.body.success, false)
  t.is(res.body.code, 404)
})

test.after.always('close server', () => {
  server.close()
})
