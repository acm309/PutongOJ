import path from 'node:path'
import { ID, Problem, User } from '@putong-oj/db'
import { UserPrivilege } from '@putong-oj/shared'
import fse from 'fs-extra'
import { deploy } from '../utils/constants.ts'
import { passwordHash } from '../utils/index.ts'
import { runMigrations } from './migrations.ts'

export async function databaseSetup () {
  await runMigrations()

  const tasks: Promise<any>[] = []

  const models = {
    Comment: 0,
    Contest: 0,
    Course: 0,
    Discussion: 0,
    Group: 0,
    Problem: 999,
    Solution: 0,
    Tag: 0,
  }
  Object.entries(models).map(async ([ name, id ]) => {
    const item = await ID.findOne({ name })
    if (!item) {
      tasks.push(new ID({ name, id }).save())
    } else if (item.id < id) {
      item.id = id
      tasks.push(item.save())
    }
  })

  const admin = await User.findOne({ uid: 'admin' })
  if (!admin) {
    tasks.push(
      new User({
        uid: 'admin',
        pwd: passwordHash(deploy.adminInitPwd),
        privilege: UserPrivilege.Root,
      }).save(),
    )
  }

  const count = await Problem.countDocuments()
  if (count === 0) {
    tasks.push(
      new Problem({
        title: 'A + B',
        description:
          'This is a test problem without any test data. '
          + 'Go to Edit tab to complete the description and other fields. '
          + 'Go to Test Data to upload new test data.',
      }).save(),
    )
    tasks.push(
      fse.outputJson(path.resolve(import.meta.dirname, '../../data/1000/', 'meta.json'), {
        testcases: [],
      }, { spaces: 2 }),
    )
  }

  await Promise.all(tasks)
}
