import process from 'node:process'
import { UserPrivilege } from '@putongoj/shared'
// import Contest from '../src/models/Contest'
import Course from '../src/models/Course'
import Group from '../src/models/Group'
import ID from '../src/models/ID'
import Problem from '../src/models/Problem'
import Solution from '../src/models/Solution'
import User from '../src/models/User'
import discussionService from '../src/services/discussion'
import { passwordHash } from '../src/utils'
import { removeall } from './helper'
// import { contestSeeds } from './seeds/contest'
import { courseSeeds } from './seeds/course'
import { discussionSeeds } from './seeds/discussion'
import { groupSeeds } from './seeds/group'
import { problemSeeds } from './seeds/problem'
import { solutionSeeds } from './seeds/solution'
import { userSeeds } from './seeds/user'

async function main () {
  await removeall()
  const { createDatabaseClient, UserPrivilege: DatabaseUserPrivilege } = await import('@putongoj/db')
  const database = createDatabaseClient(process.env.DATABASE_URL!)
  await database.$executeRawUnsafe(`
    TRUNCATE TABLE
      "SubmissionTestcaseResult",
      "Submission",
      "Comment",
      "Discussion",
      "ContestParticipation",
      "ContestProblem",
      "ContestIpWhitelist",
      "ContestAllowedGroup",
      "ContestAllowedUser",
      "Contest",
      "CourseProblem",
      "CourseMember",
      "Course",
      "ProblemTag",
      "Problem",
      "Tag",
      "GroupMember",
      "Group",
      "OAuthConnection",
      "File",
      "Post",
      "Setting",
      "UserProblemStatus",
      "UserSubmissionStats",
      "ProblemSubmissionStats",
      "DiscussionCommentStats",
      "User"
    RESTART IDENTITY CASCADE
  `)
  await Promise.all([
    new ID({ name: 'Comment', id: 0 }).save(),
    new ID({ name: 'Contest', id: 0 }).save(),
    new ID({ name: 'Course', id: 2 }).save(),
    new ID({ name: 'Discussion', id: 0 }).save(),
    new ID({ name: 'Group', id: 0 }).save(),
    new ID({ name: 'Problem', id: 999 }).save(),
    new ID({ name: 'Solution', id: 0 }).save(),
    new ID({ name: 'Tag', id: 0 }).save(),
  ])

  const postgresUsers = await database.user.createManyAndReturn({
    data: Object.values(userSeeds).map(user => ({
      username: user.uid!,
      passwordHash: passwordHash(user.pwd as string),
      privilege: [
        DatabaseUserPrivilege.BANNED,
        DatabaseUserPrivilege.USER,
        DatabaseUserPrivilege.ADMIN,
        DatabaseUserPrivilege.ROOT,
      ][user.privilege ?? UserPrivilege.User]!,
      nickname: user.nick ?? '',
    })),
  })
  const postgresUserIds = new Map(postgresUsers.map(user => [ user.username, user.id ]))
  const postgresGroups = await database.group.createManyAndReturn({
    data: groupSeeds.map((group, index) => ({
      id: index + 1,
      name: group.title,
    })),
  })
  await database.groupMember.createMany({
    data: postgresGroups.flatMap((group, index) => {
      return groupSeeds[index]!.list
        .map(username => postgresUserIds.get(username))
        .filter((userId): userId is number => userId !== undefined)
        .map(userId => ({
          groupId: group.id,
          userId,
        }))
    }),
  })
  await database.$executeRawUnsafe(`
    SELECT setval(
      pg_get_serial_sequence('"Group"', 'id'),
      COALESCE((SELECT MAX("id") FROM "Group"), 1),
      true
    )
  `)

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
  await database.$disconnect()
}

main()
  .then(() => {
    process.exit(0)
  })
