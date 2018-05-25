require('../config/db')
const User = require('../models/User')
const Problem = require('../models/Problem')
const ID = require('../models/ID')
const meta = require('./meta')
const { removeall } = require('./helper')

async function main () {
  await removeall()

  await new ID({
    id: 999,
    name: 'Problem'
  }).save()

  const admin = new User(meta.users.admin)
  const pu = new User(meta.users.pu)
  const problem = new Problem(meta.problems[1000])

  return Promise.all([
    admin.save(),
    problem.save(),
    pu.save()
  ])
}

main()
  .then(() => {
    process.exit(0)
  })
