import { UserPrivilege } from '@putongoj/shared'
import test from 'ava'
import supertest from 'supertest'
import app from '../../../src/app'
import { encryptData } from '../../../src/services/crypto'
import { deploy } from '../../../src/utils/constants'

const server = app.listen()
const request = supertest.agent(server)

test.before(async (t) => {
  const res = await request
    .post('/api/account/login')
    .send({
      username: 'admin',
      password: await encryptData(deploy.adminInitPwd),
    })
  t.is(res.status, 200)
})

test.serial('get session profile', async (t) => {
  const res = await request
    .get('/api/account/profile')

  t.is(res.status, 200)
  t.true(res.body.success)
  t.is(res.body.data.uid, 'admin')
  t.is(res.body.data.privilege, UserPrivilege.Root)
})

test('User logout', async (t) => {
  let res = await request.post('/api/account/logout')

  t.is(res.status, 200)

  // after loging out, users can not update his/her info
  res = await request
    .get('/api/account/profile')

  t.is(res.status, 200)
  t.false(res.body.success)
  t.is(res.body.data, null)
})

test.after.always('close server', () => {
  server.close()
})
