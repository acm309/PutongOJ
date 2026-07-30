import { JudgeStatus } from '@putongoj/shared'
import { getDatabase } from '../../config/postgres'
import logger from '../../utils/logger'

async function updateUserStatistic (userId: number) {
  const database = await getDatabase()
  const statuses = await database.submission.groupBy({
    by: [ 'problemId' ],
    where: { userId, status: { not: JudgeStatus.SKIPPED } },
    _count: { _all: true },
  })
  const accepted = await database.submission.groupBy({
    by: [ 'problemId' ],
    where: { userId, status: JudgeStatus.ACCEPTED },
    _count: { _all: true },
  })
  await database.$transaction([
    database.userProblemStatus.deleteMany({ where: { userId } }),
    database.userProblemStatus.createMany({
      data: statuses.map(status => ({
        userId,
        problemId: status.problemId,
        hasSubmitted: true,
        hasAccepted: accepted.some(item => item.problemId === status.problemId),
      })),
    }),
    database.userSubmissionStats.upsert({
      where: { userId },
      create: { userId, submittedProblemCount: statuses.length, solvedProblemCount: accepted.length },
      update: { submittedProblemCount: statuses.length, solvedProblemCount: accepted.length },
    }),
  ])
}

async function updateProblemStatistic (problemId: number) {
  const database = await getDatabase()
  const submitted = await database.submission.groupBy({
    by: [ 'userId' ],
    where: { problemId, status: { not: JudgeStatus.SKIPPED } },
    _count: { _all: true },
  })
  const solved = await database.submission.groupBy({
    by: [ 'userId' ],
    where: { problemId, status: JudgeStatus.ACCEPTED },
    _count: { _all: true },
  })
  await database.problemSubmissionStats.upsert({
    where: { problemId },
    create: { problemId, submitterCount: submitted.length, solverCount: solved.length },
    update: { submitterCount: submitted.length, solverCount: solved.length },
  })
}

async function updateDiscussionStatistic (discussionId: number) {
  const database = await getDatabase()
  const discussion = await database.discussion.findUnique({ where: { id: discussionId } })
  if (!discussion) { return }

  const [ count, last ] = await Promise.all([
    database.comment.count({ where: { discussionId, isHidden: false } }),
    database.comment.findFirst({
      where: { discussionId, isHidden: false },
      orderBy: { createdAt: 'desc' },
    }),
  ])
  const lastVisibleCommentAt = last?.createdAt ?? discussion.createdAt
  await database.discussionCommentStats.upsert({
    where: { discussionId },
    create: { discussionId, visibleCommentCount: count, lastVisibleCommentAt },
    update: { visibleCommentCount: count, lastVisibleCommentAt },
  })
}

export default async function updateStatistic (item: string) {
  const parts = item.split(':')
  const type = parts[0]
  const value = parts[1]
  const id = Number(value)
  if (!Number.isInteger(id)) { return }

  if (type === 'user') {
    await updateUserStatistic(id)
    return
  }
  if (type === 'problem') {
    await updateProblemStatistic(id)
    return
  }
  if (type === 'discussion') {
    await updateDiscussionStatistic(id)
    return
  }
  logger.warn(`Unknown statistic type <${type}>`)
}
