import process from 'node:process'
import { Course, Group, ID, Problem, Solution, User } from '@putong-oj/db'
import discussionService from '../src/services/discussion.ts'
import { passwordHash } from '../src/utils/index.ts'
import { removeall } from './helper.ts'
import { courseSeeds } from './seeds/course.ts'
import { discussionSeeds } from './seeds/discussion.ts'
import { groupSeeds } from './seeds/group.ts'
import { problemSeeds } from './seeds/problem.ts'
import { solutionSeeds } from './seeds/solution.ts'
import { userSeeds } from './seeds/user.ts'

async function main () {
  await removeall()
  await Promise.all([
    Group.syncIndexes(),
    User.syncIndexes(),
  ])
  await Promise.all([
    new ID({ name: 'Comment', id: 0 }).save(),
    new ID({ name: 'Contest', id: 0 }).save(),
    new ID({ name: 'Course', id: 2 }).save(),
    new ID({ name: 'Discussion', id: 0 }).save(),
    new ID({ name: 'Problem', id: 999 }).save(),
    new ID({ name: 'Solution', id: 0 }).save(),
    new ID({ name: 'Tag', id: 0 }).save(),
  ])

  const courseInsert = Promise.all(
    courseSeeds.map(item => new Course(item).save()),
  )
  const groupInsert = Promise.all(
    groupSeeds.map(item => new Group(item).save()),
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
  const userInsert = Promise.all(
    Object.values(userSeeds).map((user) => {
      return new User(Object.assign({}, user, {
        pwd: passwordHash(user.pwd as string),
      })).save()
    }),
  )

  await Promise.all([
    courseInsert,
    groupInsert,
    problemInsert,
    solutionInsert,
    userInsert,
  ])

  // Seed discussions - must be done after users and problems
  const discussionInsert = (async () => {
    for (const discussionSeed of discussionSeeds) {
      const author = await User.findOne({ uid: discussionSeed.authorUid })
      if (!author) {
        console.error(`Author ${discussionSeed.authorUid} not found`)
        continue
      }

      let problem = null
      if (discussionSeed.problemPid) {
        problem = await Problem.findOne({ pid: discussionSeed.problemPid })
        if (!problem) {
          console.error(`Problem ${discussionSeed.problemPid} not found`)
        }
      }

      await discussionService.createDiscussion({
        author: author._id,
        problem: problem?._id || null,
        contest: null,
        type: discussionSeed.type,
        title: discussionSeed.title,
        content: discussionSeed.content,
      })
    }
  })()

  await discussionInsert
}

main()
  .then(() => {
    process.exit(0)
  })
