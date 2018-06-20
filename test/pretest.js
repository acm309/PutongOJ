require('../config/db')
const User = require('../models/User')
const Problem = require('../models/Problem')
const ID = require('../models/ID')
const Group = require('../models/Group')
const meta = require('./meta')
const { removeall } = require('./helper')
const { generatePwd } = require('../utils/helper')

const userSeeds = require('./seed/users')

async function main () {
  await removeall()

  await Promise.all([
    new ID({
      id: 999,
      name: 'Problem'
    }).save(),
    new ID({
      id: 0,
      name: 'Solution'
    }).save(),
    new ID({
      id: 0,
      name: 'Group'
    }).save()
  ])

  const problem = new Problem(meta.problems[1000])
  const group = new Group(meta.groups[1])

  const users = Promise.all(
    Object.values(userSeeds.data).map((user) => {
      return new User(Object.assign(user, {
        pwd: generatePwd(user.pwd)
      })).save()
    }))

  return Promise.all([
    users,
    problem.save(),
    group.save()
  ])
}

main()
  .then(() => {
    process.exit(0)
  })
