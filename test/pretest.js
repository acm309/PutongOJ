require('../config/db')
const config = require('../config')
const User = require('../models/User')
const Problem = require('../models/Problem')
const ID = require('../models/ID')
const { generatePwd } = require('../utils/helper')
const meta = require('./meta')

async function removeall () {
  return Promise.all([
    User.remove({}).exec(),
    Problem.remove({}).exec(),
    ID.remove({}).exec()
  ])
}

async function main () {
  await removeall()

  await new ID({
    id: 999,
    name: 'Problem'
  }).save()

  const admin = new User({
    uid: 'admin',
    pwd: generatePwd('kplkplkpl'),
    nick: 'Test',
    privilege: config.privilege.Root
  })
  const problem = new Problem(meta.problems[1000])

  await Promise.all([
    admin.save(),
    problem.save()
  ])
}

main()
  .then(() => {
    process.exit(0)
  })
