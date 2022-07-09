const test = require('ava')
const supertest = require('supertest')
const app = require('../../../app')
const users = require('../../seed/users')
const config = require('../../../config')

const server = app.listen()
const request = supertest.agent(server)

test.before('Login', async (t) => {
  const login = await request
    .post('/api/session')
    .send({
      uid: 'admin',
      pwd: config.deploy.adminInitPwd,
    })

  t.is(login.status, 200)
})

test.serial('can update other user info', async (t) => {
  const user = Object.values(users.data)[5]
  const res = await request
    .put(`/api/user/${user.uid}`)
    .send({
      nick: 'new nick name',
    })

  t.is(res.status, 200)
})

test.after.always('close server', () => {
  server.close()
})
