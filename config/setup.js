const fse = require('fs-extra')
const path =require('path')
const ID = require('../models/ID')
const User = require('../models/User')
const Problem = require('../models/Problem')
const config = require('.')
const { generatePwd } = require('../utils/helper')

async function databaseSetup () {
  const models = [
    'Solution', 'Contest', 'News', 'Group'
  ]
  const ps = models.map(async (model) => {
    const item = await ID.findOne({ name: model }).exec()
    if (item != null && item.id >= 0) return
    return new ID({ name: model, id: 0 }).save()
  })

  const admin = await User.findOne({uid: 'admin'}).exec()
  if (admin == null) {
    ps.push(new User({
      uid: 'admin',
      nick: 'admin',
      pwd: generatePwd(config.deploy.adminInitPwd),
      privilege: 3
    }).save())
  }

  const count = await Problem.count().exec()
  if (count === 0) {
    await new ID({name: 'Problem', id: 999}).save()
    ps.push(new Problem({
      title: 'A + B',
      description: 'This is a test problem without any test data. Go to Edit tab to complete the description and other fields. Go to Test Data to upload new test data'
    }).save())
    ps.push(fse.outputJsonSync(path.resolve(__dirname, `../data/1000/`, 'meta.json'), {
      testcases: []
    }, { spaces: 2 })) // 缩进2个空格

  }
  return Promise.all(ps)
}

module.exports = databaseSetup
