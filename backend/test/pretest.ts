import process from 'node:process'
import Contest from '../src/models/Contest'
import Course from '../src/models/Course'
// import Discuss from '../src/models/Discuss'
import Group from '../src/models/Group'
import ID from '../src/models/ID'
import News from '../src/models/News'
import Problem from '../src/models/Problem'
import Solution from '../src/models/Solution'
// const Tag = require('../src/models/Tag')
import User from '../src/models/User'
import { passwordHash } from '../src/utils'
import { removeall } from './helper'
import { contestSeeds } from './seeds/contest'
import { courseSeeds } from './seeds/course'
// import { discussSeeds } from './seeds/discuss'
import { groupSeeds } from './seeds/group'
import { newsSeeds } from './seeds/news'
import { problemSeeds } from './seeds/problem'
import { solutionSeeds } from './seeds/solution'
// const { tagSeeds } = require('./seeds/tag')
import { userSeeds } from './seeds/user'

async function main () {
  await removeall()
  await Promise.all([
    new ID({ name: 'Contest', id: 0 }).save(),
    new ID({ name: 'Course', id: 2 }).save(),
    new ID({ name: 'Discussion', id: 0 }).save(),
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
  // const discussInsert = (async () => {
  //   for (const discuss of discussSeeds) {
  //     await new Discuss(discuss).save()
  //   }
  // })()
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
        pwd: passwordHash(user.pwd!),
      })).save()
    }),
  )

  await Promise.all([
    contestInsert,
    courseInsert,
    // discussInsert,
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
