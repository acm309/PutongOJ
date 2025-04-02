const path = require('node:path')
const fse = require('fs-extra')
const config = require('.')
const ID = require('../models/ID')
const Problem = require('../models/Problem')
const User = require('../models/User')
const { generatePwd } = require('../utils/helper')

async function databaseSetup () {
  const models = {
    Contest: 0,
    Course: 0,
    Discuss: 0,
    Group: 0,
    News: 0,
    Problem: 999,
    Solution: 0,
  }

  const ps = Object.entries(models).map(async ([ model, id ]) => {
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

  const count = await Problem.count().exec()
  if (count === 0) {
    ps.push(new Problem({
      title: 'A + B',
      description: 'This is a test problem without any test data. Go to Edit tab to complete the description and other fields. Go to Test Data to upload new test data',
    }).save())
    ps.push(fse.outputJsonSync(path.resolve(__dirname, '../data/1000/', 'meta.json'), {
      testcases: [],
    }, { spaces: 2 })) // 缩进2个空格
  }
  return Promise.all(ps)
}

module.exports = databaseSetup
