import path from 'node:path'
import fse from 'fs-extra'
import config from '.'
import ID from '../models/ID'
import Problem from '../models/Problem'
import User from '../models/User'
import { generatePwd } from '../utils'

async function databaseSetup () {
  const models = {
    Contest: 0,
    Course: 0,
    Discuss: 0,
    Group: 0,
    News: 0,
    Problem: 999,
    Solution: 0,
    Tag: 0,
  }

  const ps: Promise<any>[]
   = Object.entries(models).map(async ([ model, id ]) => {
     const item = await ID.findOne({ name: model }).exec()
     if (item != null && item.id >= id) { return }
     return new ID({ name: model, id }).save()
   })

  const admin = await User.findOne({ uid: 'admin' }).exec()
  if (admin == null) {
    ps.push(new User({
      uid: 'admin',
      nick: 'admin',
      pwd: generatePwd(config.deploy.adminInitPwd),
      privilege: 3,
    }).save())
  }

  const count = await Problem.countDocuments().exec()
  if (count === 0) {
    ps.push(new Problem({
      title: 'A + B',
      description: 'This is a test problem without any test data. Go to Edit tab to complete the description and other fields. Go to Test Data to upload new test data',
    }).save())
    ps.push(fse.outputJson(path.resolve(__dirname, '../../data/1000/', 'meta.json'), {
      testcases: [],
    }, { spaces: 2 })) // 缩进2个空格
  }
  return Promise.all(ps)
}

export default module.exports = databaseSetup
