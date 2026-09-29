import { Comment, Discussion, Problem, Solution, User } from '@putong-oj/db'
import { JudgeStatus } from '@putong-oj/shared'
import { createLogger } from '../logger.ts'

const logger = createLogger('worker.update-statistic')

/**
 * 更新用户的统计信息
 * @param userId 用户 ObjectId
 */
async function updateUserStatistic (userId: string) {
  const [ submitProblems, solveProblems ] = await Promise.all([
    Solution.distinct('problem', { user: userId, judge: { $ne: JudgeStatus.Skipped } }),
    Solution.distinct('problem', { user: userId, judge: JudgeStatus.Accepted }),
  ])
  await User.updateOne(
    { _id: userId },
    {
      $set: {
        submit: submitProblems.length,
        solve: solveProblems.length,
      },
    },
  ).exec()

  logger.info({ userId }, 'User statistic updated')
}

/**
 * 更新题目的统计信息
 * @param problemId 题目 ObjectId
 */
async function updateProblemStatistic (problemId: string) {
  const [ submitUsers, acceptedUsers ] = await Promise.all([
    Solution.distinct('user', { problem: problemId, judge: { $ne: JudgeStatus.Skipped } }),
    Solution.distinct('user', { problem: problemId, judge: JudgeStatus.Accepted }),
  ])
  await Problem.findOneAndUpdate(
    { _id: problemId },
    {
      $set: {
        submit: submitUsers.length,
        solve: acceptedUsers.length,
      },
    },
  ).exec()

  logger.info({ problemId }, 'Problem statistic updated')
}

async function updateDiscussionStatistic (discussion: string) {
  const discussionDoc = await Discussion.findOne({ _id: discussion })
  if (!discussionDoc) {
    logger.warn({ discussion }, 'Discussion not found while updating statistic')
    return
  }

  const [ commentsCount, lastComment ] = await Promise.all([
    Comment.countDocuments({ discussion: discussionDoc._id }),
    Comment.findOne({ discussion: discussionDoc._id }).sort({ createdAt: -1 }),
  ])
  await Discussion.findByIdAndUpdate(
    discussionDoc._id,
    {
      $set: {
        comments: commentsCount,
        lastCommentAt: lastComment?.createdAt || discussionDoc.createdAt,
      },
    },
  )

  logger.info({ discussionId: discussionDoc._id }, 'Discussion statistic updated')
}

/**
 * 更新统计信息
 * @param item 任务项，格式为 `type:id`
 */
async function updateStatistic (item: string) {
  const type = item.slice(0, item.indexOf(':'))
  const id = item.slice(item.indexOf(':') + 1)

  switch (type) {
    case 'user':
      await updateUserStatistic(id)
      break
    case 'problem':
      await updateProblemStatistic(id)
      break
    case 'discussion':
      await updateDiscussionStatistic(id)
      break
    default:
      logger.warn({ type }, 'Unknown statistic type')
  }
}

export default updateStatistic
