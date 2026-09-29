import { randomUUID } from 'node:crypto'
import process from 'node:process'
import { Comment, Course, Discussion, Group, ID, Problem, Solution, User } from '@putong-oj/db'
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
    Comment.syncIndexes(),
    Course.syncIndexes(),
    Discussion.syncIndexes(),
    Group.syncIndexes(),
    Solution.syncIndexes(),
    User.syncIndexes(),
  ])
  await Promise.all([
    new ID({ name: 'Contest', id: 0 }).save(),
    new ID({ name: 'Problem', id: 999 }).save(),
    new ID({ name: 'Solution', id: 0 }).save(),
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
  const userInsert = (async () => {
    await Promise.all(
      Object.values(userSeeds).map((user) => {
        return new User(Object.assign({}, user, {
          pwd: passwordHash(user.pwd as string),
        })).save()
      }),
    )
    await new User({
      uid: 'ghost',
      nick: 'ghost',
      pwd: passwordHash(randomUUID()),
    }).save()
  })()

  await Promise.all([
    courseInsert,
    groupInsert,
    problemInsert,
    userInsert,
  ])

  const solutionInsert = (async () => {
    const users = await User.find({})
    const userByUid = new Map(users.map(user => [ user.uid, user ]))
    const ghost = userByUid.get('ghost')!
    const problems = await Problem.find({})
    const problemByPid = new Map(problems.map(problem => [ problem.pid, problem ]))
    const solutions = []

    for (const solutionSeed of solutionSeeds) {
      const { uid, pid, ...solution } = solutionSeed
      const user = userByUid.get(uid) ?? ghost
      const problem = problemByPid.get(pid)
      if (!problem) {
        throw new Error(`Problem ${pid} not found while seeding solutions`)
      }
      solutions.push(await new Solution({ ...solution, problem: problem._id, user: user._id }).save())
    }

    const similarSolution = solutions.find(solution => solution.similarity > 0)
    const targetSolution = solutions.find(solution => solution.sid === 2)
    if (similarSolution && targetSolution) {
      similarSolution.similarSolution = targetSolution._id
      await similarSolution.save()
    }
  })()
  await solutionInsert

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
