require('dotenv-flow').config()
require('../src/config/db')
const process = require('node:process')

const Contest = require('../src/models/Contest')
const Course = require('../src/models/Course')
const Discuss = require('../src/models/Discuss')
const Group = require('../src/models/Group')
const ID = require('../src/models/ID')
const News = require('../src/models/News')
const Problem = require('../src/models/Problem')
const Solution = require('../src/models/Solution')
// const Tag = require('../src/models/Tag')
const User = require('../src/models/User')

const { generatePwd } = require('../src/utils')
const { removeall } = require('./helper')

const { contestSeeds } = require('./seeds/contest')
const { courseSeeds } = require('./seeds/course')
const { discussSeeds } = require('./seeds/discuss')
const { groupSeeds } = require('./seeds/group')
const { newsSeeds } = require('./seeds/news')
const { problemSeeds } = require('./seeds/problem')
const { solutionSeeds } = require('./seeds/solution')
// const { tagSeeds } = require('./seeds/tag')
const { userSeeds } = require('./seeds/user')

async function main () {
  await removeall()
  await Promise.all([
    new ID({ name: 'Contest', id: 0 }).save(),
    new ID({ name: 'Course', id: 2 }).save(),
    new ID({ name: 'Discuss', id: 0 }).save(),
    new ID({ name: 'Group', id: 0 }).save(),
    new ID({ name: 'News', id: 0 }).save(),
    new ID({ name: 'Problem', id: 999 }).save(),
    new ID({ name: 'Solution', id: 0 }).save(),
    new ID({ name: 'Tag', id: 0 }).save(),
  ])

  const contestInsert = (async () => {
    for (const contest of contestSeeds) {
      await new Contest(contest).save()
    }
  })()
  const courseInsert = Promise.all(
    courseSeeds.map(item => new Course(item).save()),
  )
  const discussInsert = (async () => {
    for (const discuss of discussSeeds) {
      await new Discuss(discuss).save()
    }
  })()
  const groupInsert = Promise.all(
    groupSeeds.map(item => new Group(item).save()),
  )
  const newsInsert = Promise.all(
    newsSeeds.map(item => new News(item).save()),
  )
  const problemInsert = (async () => {
    for (const problem of problemSeeds) {
      await new Problem(problem).save()
    }
  })()
  const solutionInsert = (async () => {
    for (const solution of solutionSeeds) {
      await new Solution(solution).save()
    }
  })()
  // const tagInsert = Promise.all(
  //   Object.values(tagSeeds).map((tag) => {
  //     return new Tag(tag).save()
  //   }),
  // )
  const userInsert = Promise.all(
    Object.values(userSeeds).map((user) => {
      return new User(Object.assign(user, {
        pwd: generatePwd(user.pwd),
      })).save()
    }),
  )

  return Promise.all([
    contestInsert,
    courseInsert,
    discussInsert,
    groupInsert,
    newsInsert,
    problemInsert,
    solutionInsert,
    // tagInsert,
    userInsert,
  ])
}

main()
  .then(() => {
    process.exit(0)
  })
