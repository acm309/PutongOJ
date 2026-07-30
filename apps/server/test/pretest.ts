import type { DiscussionType, JudgeStatus } from '@putongoj/db'
import process from 'node:process'
import { passwordHash } from '../src/utils'
import { resetDatabase } from './helper'
import { contestSeeds } from './seeds/contest'
import { courseSeeds } from './seeds/course'
import { discussionSeeds } from './seeds/discussion'
import { groupSeeds } from './seeds/group'
import { problemSeeds } from './seeds/problem'
import { solutionSeeds } from './seeds/solution'
import { userSeeds } from './seeds/user'

const languageMap = [ 'C', 'CPP_11', 'JAVA', 'PYTHON', 'CPP_17', 'PYPY' ] as const

async function main () {
  await resetDatabase()
  const { createDatabaseClient } = await import('@putongoj/db')
  const database = createDatabaseClient(process.env.DATABASE_URL!)
  try {
    const users = await database.user.createManyAndReturn({
      data: Object.values(userSeeds).map(user => ({
        username: user.username,
        passwordHash: passwordHash(user.pwd ?? ''),
        privilege: user.privilege ?? 'USER',
        nickname: user.nickname ?? '',
      })),
    })
    const userIdByName = new Map(users.map(user => [ user.username, user.id ]))

    const groups = await database.group.createManyAndReturn({
      data: groupSeeds.map((group, index) => ({ id: index + 1, name: group.name })),
    })
    await database.groupMember.createMany({
      data: groups.flatMap((group, index) => groupSeeds[index]!.usernames
        .map(username => userIdByName.get(username))
        .filter((id): id is number => id !== undefined)
        .map(userId => ({ groupId: group.id, userId }))),
    })
    await database.course.createMany({ data: courseSeeds })

    const problems = await database.problem.createManyAndReturn({
      data: problemSeeds.map((problem, index) => ({
        id: 1000 + index,
        title: problem.title,
        description: problem.description,
        inputFormat: problem.input,
        outputFormat: problem.output,
        sampleInput: problem.in,
        sampleOutput: problem.out,
        visibility: problem.visibility,
      })),
    })
    const problemIdByLegacyId = new Map(problems.map(problem => [ problem.id, problem.id ]))

    const createdSubmissions = []
    for (const seed of solutionSeeds) {
      const userId = userIdByName.get(seed.username)
      const problemId = problemIdByLegacyId.get(seed.problemId)
      if (!userId || !problemId) { continue }
      createdSubmissions.push(await database.submission.create({
        data: {
          userId,
          problemId,
          sourceCode: seed.sourceCode,
          language: languageMap[seed.language - 1] ?? 'CPP_11',
          status: seed.status as JudgeStatus,
          timeUsedMs: seed.timeUsedMs,
          memoryUsedKb: seed.memoryUsedKb,
          similarity: seed.similarity,
          createdAt: new Date(seed.createdAt),
        },
      }))
    }
    for (let index = 0; index < solutionSeeds.length; index++) {
      const seed = solutionSeeds[index]!
      const submission = createdSubmissions[index]
      if (!submission) { continue }
      await database.submissionTestcaseResult.createMany({
        data: seed.testcases.map(testcase => ({
          submissionId: submission.id,
          testcaseId: testcase.uuid,
          status: testcase.status as JudgeStatus,
          timeUsedMs: testcase.timeUsedMs,
          memoryUsedKb: testcase.memoryUsedKb,
        })),
      })
    }

    const submissionByLegacyIndex = new Map(createdSubmissions.map((submission, index) => [ index + 1, submission.id ]))
    for (const seed of solutionSeeds) {
      const target = createdSubmissions[solutionSeeds.indexOf(seed)]
      const similarSubmissionId = submissionByLegacyIndex.get(seed.similarSubmissionIndex)
      if (target && similarSubmissionId) {
        await database.submission.update({ where: { id: target.id }, data: { similarSubmissionId } })
      }
    }

    for (const seed of contestSeeds) {
      const contest = await database.contest.create({
        data: {
          title: seed.title,
          startsAt: new Date(seed.start),
          endsAt: new Date(seed.end),
          isPublic: seed.isPublic,
          password: seed.password,
          isHidden: false,
        },
      })
      await database.contestProblem.createMany({
        data: seed.problemIds.map((problemId, index) => ({ contestId: contest.id, problemId, position: index + 1 })),
        skipDuplicates: true,
      })
    }

    await database.$executeRawUnsafe(`
      SELECT setval(pg_get_serial_sequence('"Course"', 'id'), COALESCE((SELECT MAX("id") FROM "Course"), 1), true);
      SELECT setval(pg_get_serial_sequence('"Problem"', 'id'), COALESCE((SELECT MAX("id") FROM "Problem"), 1), true);
      SELECT setval(pg_get_serial_sequence('"Group"', 'id'), COALESCE((SELECT MAX("id") FROM "Group"), 1), true);
    `)

    for (const seed of discussionSeeds) {
      const authorId = userIdByName.get(seed.authorUid)
      if (!authorId) { continue }
      const discussion = await database.discussion.create({
        data: {
          authorId,
          problemId: seed.problemPid ?? null,
          type: seed.type as DiscussionType,
          title: seed.title,
        },
      })
      await database.comment.create({ data: { discussionId: discussion.id, authorId, content: seed.content } })
    }
  } finally {
    await database.$disconnect()
  }
}

void main().then(() => process.exit(0))
