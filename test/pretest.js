const User = require('../models/User')
const Problem = require('../models/Problem')
const ID = require('../models/ID')
const Group = require('../models/Group')
const News = require('../models/News')
const meta = require('./meta')
const { removeall } = require('./helper')
const { generatePwd } = require('../utils/helper')
require('../config/db')

const userSeeds = require('./seed/users')
const newsSeeds = require('./seed/news')
const problemSeeds = require('./seed/problems')

async function main () {
  await removeall()

  await Promise.all([
    new ID({
      id: 1000,
      name: 'Problem'
    }).save(),
    new ID({
      id: 0,
      name: 'Solution'
    }).save(),
    new ID({
      id: 0,
      name: 'Group'
    }).save(),
    new ID({
      id: 0,
      name: 'News'
    }).save()
  ])

  const group = new Group(meta.groups[1])

  const news = Promise.all(
    newsSeeds.data.map((item) => new News(item).save())
  )

  const users = Promise.all(
    Object.values(userSeeds.data).map((user) => {
      return new User(Object.assign(user, {
        pwd: generatePwd(user.pwd)
      })).save()
    }))

  const problems = Promise.all(
    problemSeeds.data.map((item) => new Problem(item).save())
  )

  return Promise.all([
    users,
    news,
    problems,
    group.save()
  ])
}

main()
  .then(() => {
    process.exit(0)
  })
