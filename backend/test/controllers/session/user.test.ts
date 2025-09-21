import test from 'ava'
import supertest from 'supertest'
import app from '../../../src/app'
import config from '../../../src/config'
import { encryptData } from '../../../src/services/crypto'

const server = app.listen()
const request = supertest.agent(server)

test.before(async (t) => {
  const res = await request
    .post('/api/session')
    .send({
      uid: 'admin',
      pwd: await encryptData(config.deploy.adminInitPwd),
    })
  t.is(res.status, 200)
})

test.serial('get session profile', async (t) => {
  const res = await request
    .get('/api/session')

  t.is(res.status, 200)
  t.is(res.body.profile.uid, 'admin')
  t.is(res.body.profile.privilege, config.privilege.Root)
})

test('User logout', async (t) => {
  let res = await request.del('/api/session')

  t.is(res.status, 200)

  // after loging out, users can not update his/her info
  res = await request
    .put('/api/user/admin')
    .send({ nick: 'failed' })

  t.is(res.status, 401)
})

test.after.always('close server', () => {
  server.close()
})
