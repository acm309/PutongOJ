import path from 'node:path'
import { UserPrivilege } from '@putongoj/shared'
import fse from 'fs-extra'
import { passwordHash } from '../utils'
import { deploy } from '../utils/constants'
import { getDatabase } from './postgres'

export async function databaseSetup () {
  const database = await getDatabase()
  await database.user.upsert({
    where: { username: 'admin' },
    create: {
      username: 'admin',
      passwordHash: passwordHash(deploy.adminInitPwd),
      privilege: UserPrivilege.ROOT,
    },
    update: {},
  })

  const count = await database.problem.count()
  if (count !== 0) {
    return
  }

  const problem = await database.problem.create({
    data: {
      title: 'A + B',
      description: 'This is a test problem without any test data. Go to Edit tab to complete the description and other fields. Go to Test Data to upload new test data.',
    },
  })
  await fse.outputJson(
    path.resolve(__dirname, `../../data/${problem.id}/meta.json`),
    { testcases: [] },
    { spaces: 2 },
  )
}
