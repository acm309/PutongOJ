import test from 'ava'
import supertest from 'supertest'
import app from '../../../src/app'
import { getDatabase } from '../../../src/config/postgres'
import { encryptData } from '../../../src/services/crypto'
import { deploy } from '../../../src/utils/constants'
import { userSeeds } from '../../seeds/user'

const server = app.listen()
const request = supertest.agent(server)

async function getUserId (username: string): Promise<number> {
  const database = await getDatabase()
  return (await database.user.findUniqueOrThrow({ where: { username } })).id
}

test.before('Login', async (t) => {
  const login = await request
    .post('/api/account/login')
    .send({
      username: 'admin',
      password: await encryptData(deploy.adminInitPwd),
    })

  t.is(login.status, 200)
})

test.serial('create new group', async (t) => {
  const create = await request
    .post('/api/admin/groups')
    .send({
      name: '测试组2',
    })

  t.is(create.status, 200)
})

test.serial('Update Group 2', async (t) => {
  const update = await request
    .put('/api/admin/groups/2')
    .send({
      name: '测试组更新2',
    })
  t.is(update.status, 200)

  const updateMembers = await request
    .put('/api/admin/groups/2/members')
    .send({
      memberIds: [ await getUserId('admin') ],
    })
  t.is(updateMembers.status, 200)

  const find = await request
    .get('/api/admin/groups/2')

  t.is(find.status, 200)
  t.is(find.body.data.name, '测试组更新2')
  t.deepEqual(find.body.data.memberIds, [ await getUserId('admin') ])

  const user = await request
    .get('/api/users/admin')

  t.true(user.body.data.groups.some((group: any) => group.id === 2))
})

test.serial('Update Group 2 -- update members', async (t) => {
  const user = userSeeds.primaryuser
  const update = await request
    .put('/api/admin/groups/2/members')
    .send({
      memberIds: [ await getUserId(user.username) ],
    })
  t.is(update.status, 200)

  const find = await request
    .get('/api/admin/groups/2')

  t.is(find.status, 200)
  t.is(find.body.data.name, '测试组更新2')
  t.deepEqual(find.body.data.memberIds, [ await getUserId(user.username) ])

  let r = await request
    .get('/api/users/admin')

  t.false(r.body.data.groups.some((group: any) => group.id === 2))

  r = await request
    .get(`/api/users/${user.username}`)

  t.true(r.body.data.groups.some((group: any) => group.id === 2))
})

test.serial.skip('Delete Group 2', async (t) => {
  const del = await request
    .delete('/api/group/2')
  t.is(del.status, 200)

  const find = await request
    .get('/api/group/2')

  t.is(find.status, 400)

  const user = await request
    .get('/api/users/admin')

  t.false(user.body.data.groups.some((group: any) => group.id === 2))
})

test('The length of group title should be greater than 3', async (t) => {
  const res = await request
    .post('/api/admin/groups')
    .send({
      name: '1',
    })

  t.is(res.status, 200)
  t.false(res.body.success)
})

test('The length of group title should be less than 80', async (t) => {
  const res = await request
    .post('/api/admin/groups')
    .send({
      name: Array.from({ length: 50 }, (_, i) => `${i}`).join(''),
    })

  t.is(res.status, 200)
  t.false(res.body.success)
})

test.after.always('close server', () => {
  server.close()
})
