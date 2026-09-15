import test from 'ava'
import supertest from 'supertest'
import app from '../../../src/app'
import { encryptData } from '../../../src/services/crypto'
import { userSeeds } from '../../seeds/user'

const server = app.listen()
const request = supertest.agent(server)

const pwd = 'Aa@123456'

test('View user doesnt exist', async (t) => {
  const r = await request
    .get('/api/users/test23615')
  t.is(r.status, 200)
  t.is(r.body.success, false)
  t.is(r.body.code, 404)
})

test.skip('Fetch user list', async (t) => {
  const r = await request
    .get('/api/users/list')
  t.is(r.status, 200)
  t.true(Array.isArray(r.body.docs))
  t.true(r.body.docs.length > 0)
  const u = r.body.docs[0]
  t.is(typeof u.uid, 'string')
  t.is(typeof u.privilege, 'number')
})

test.skip('Fetch entire user list', async (t) => {
  const r = await request
    .get('/api/users/list?page=-1')
  t.is(r.status, 200)
  t.true(Array.isArray(r.body.docs))
  t.true(r.body.docs.length > 0)
  t.is(typeof r.body.total, 'number')
})

test('Create user already exists', async (t) => {
  const res = await request
    .post('/api/account/register')
    .send({ username: userSeeds.admin.uid, password: await encryptData(pwd) })
  t.is(res.status, 200)
  t.is(res.body.success, false)
  t.is(res.body.data, null)
})

test('Create user without uid', async (t) => {
  const res = await request
    .post('/api/account/register')
    .send({ password: await encryptData(pwd) })
  t.is(res.status, 200)
  t.is(res.body.success, false)
  t.is(res.body.data, null)
})

test('Create user with uid not valid (char not allowed)', async (t) => {
  const res = await request
    .post('/api/account/register')
    .send({ username: 'admin@', password: await encryptData(pwd) })
  t.is(res.status, 200)
  t.is(res.body.success, false)
  t.is(res.body.data, null)
})

test('Create user with uid not valid (too sort)', async (t) => {
  const res = await request
    .post('/api/account/register')
    .send({ username: 'hi', password: await encryptData(pwd) })
  t.is(res.status, 200)
  t.is(res.body.success, false)
  t.is(res.body.data, null)
})

test('Create user with uid not valid (too long)', async (t) => {
  const res = await request
    .post('/api/account/register')
    .send({ username: 'a'.repeat(21), password: await encryptData(pwd) })
  t.is(res.status, 200)
  t.is(res.body.success, false)
  t.is(res.body.data, null)
})

test('Create user without pwd', async (t) => {
  const res = await request
    .post('/api/account/register')
    .send({ username: 'test20810' })
  t.is(res.status, 200)
  t.is(res.body.success, false)
  t.is(res.body.data, null)
})

test('Create user with pwd not valid (too short)', async (t) => {
  const res = await request
    .post('/api/account/register')
    .send({ username: 'test17873', password: await encryptData('Aa@1') })
  t.is(res.status, 200)
  t.is(res.body.success, false)
  t.is(res.body.data, null)
})

test('Create user with pwd not valid (too simple)', async (t) => {
  const res = await request
    .post('/api/account/register')
    .send({ username: 'test28699', password: await encryptData('12345678') })
  t.is(res.status, 200)
  t.is(res.body.success, false)
  t.is(res.body.data, null)
})

test.after.always('close server', () => {
  server.close()
})
