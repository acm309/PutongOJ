import Comment from '../../models/Comment'
import Discussion from '../../models/Discussion'
import Problem from '../../models/Problem'
import Solution from '../../models/Solution'
import User from '../../models/User'
import { judge } from '../../utils/constants'
import logger from '../../utils/logger'

/**
 * 更新用户的统计信息
 * @param uid 用户 ID
 */
async function updateUserStatistic (uid: string) {
  uid = uid.trim()

  const [ submitProblems, solveProblems ] = await Promise.all([
    Solution.distinct('pid', { uid }),
    Solution.distinct('pid', { uid, judge: judge.Accepted }),
  ])
  await User.findOneAndUpdate(
    { uid },
    {
      $set: {
        submit: submitProblems.length,
        solve: solveProblems.length,
      },
    },
  ).exec()

  logger.info(`User <${uid}> statistic updated`)
}

/**
 * 更新题目的统计信息
 * @param pid 题目 ID
 */
async function updateProblemStatistic (pid: number | string) {
  if (typeof pid === 'string') {
    pid = Number.parseInt(pid, 10)
  }

  const [ submitUsers, acceptedUsers ] = await Promise.all([
    Solution.distinct('uid', { pid }),
    Solution.distinct('uid', { pid, judge: judge.Accepted }),
  ])
  await Problem.findOneAndUpdate(
    { pid },
    {
      $set: {
        submit: submitUsers.length,
        solve: acceptedUsers.length,
      },
    },
  ).exec()

  logger.info(`Problem <${pid}> statistic updated`)
}

async function updateDiscussionStatistic (discussion: string) {
  const discussionDoc = await Discussion.findOne({ _id: discussion })
  if (!discussionDoc) {
    logger.warn(`Discussion <${discussion}> not found while updating statistic`)
    return
  }

  const { discussionId } = discussionDoc
  const [ commentsCount, lastComment ] = await Promise.all([
    Comment.countDocuments({ discussion: discussionDoc._id }),
    Comment.findOne({ discussion: discussionDoc._id }).sort({ createdAt: -1 }),
  ])
  await Discussion.findOneAndUpdate(
    { discussionId },
    {
      $set: {
        comments: commentsCount,
        lastCommentAt: lastComment?.createdAt || discussionDoc.createdAt,
      },
    },
  )

  logger.info(`Discussion <${discussionId}> statistic updated`)
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
      logger.warn(`Unknown statistic type <${type}>`)
  }
}

export default updateStatistic
