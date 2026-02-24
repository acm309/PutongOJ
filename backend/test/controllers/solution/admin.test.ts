import { JudgeStatus } from '@putongoj/shared'
import test from 'ava'
import supertest from 'supertest'
import app from '../../../src/app'
import config from '../../../src/config'
import { encryptData } from '../../../src/services/crypto'

const server = app.listen()
const request = supertest.agent(server)

test.before('Login', async (t) => {
  const login = await request
    .post('/api/account/login')
    .send({
      username: 'admin',
      password: await encryptData(config.deploy.adminInitPwd),
    })

  t.is(login.status, 200)
})

test('Can see solution and sim of other users', async (t) => {
  const res = await request
    .get('/api/status/4')

  t.is(res.status, 200)
  t.truthy(res.body.solution.sim)
  t.truthy(res.body.solution.sim_s_id)
  t.truthy(res.body.solution.code)
})

test('Push solution to rejudge', async (t) => {
  const res = await request
    .put('/api/status/3')
    .send({ judge: JudgeStatus.RejudgePending })

  t.is(res.status, 200)
})

test.after.always('close server', () => {
  server.close()
})
