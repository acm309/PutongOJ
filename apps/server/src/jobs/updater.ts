import type { WebSocketDispatch, WebSocketMessage } from '@putong-oj/shared'
import { Solution } from '@putong-oj/db'
import { JudgeStatus, WebSocketDispatchType, WebSocketMessageType } from '@putong-oj/shared'
import redis from '../config/redis.ts'
import logger from '../utils/logger.ts'
import { distributeWork } from './helper.ts'
import '../config/db.ts'

/**
 * @NOTE
 *
 * Updater 只消费 Judger 的结果通知。
 * 测评结果已经由 Judger 写入数据库，这里负责推送 WebSocket 和触发后续任务。
 */

async function notifyResult (solutionId: string) {
  const solution = await Solution.findOne({ _id: solutionId }).lean().exec()
  if (solution == null) {
    logger.warn(`Solution <${solutionId}> not found`)
    return
  }
  if (solution.judge === JudgeStatus.RunningJudge) {
    return
  }

  const message: WebSocketMessage = {
    type: WebSocketMessageType.SubmissionResult,
    data: {
      solutionId: solution.sid,
      judgeStatus: solution.judge as any,
    },
  }
  const dispatch: WebSocketDispatch = {
    type: WebSocketDispatchType.User,
    username: solution.uid,
    message,
  }

  const tasks = [
    distributeWork('updateStatistic', `problem:${solution.pid}`),
    distributeWork('updateStatistic', `user:${solution.uid}`),
    redis.publish('websocket:message', JSON.stringify(dispatch)),
  ] as Promise<any>[]
  if (solution.judge === JudgeStatus.Accepted) {
    tasks.push(distributeWork('checkSimilarity', solution.sid))
  }
  await Promise.all(tasks)
  logger.info(`Notified solution <${solution.sid}> result: ${solution.judge}`)
}

async function main () {
  logger.info('Updater is running...')
  while (true) {
    try {
      const blpopResult = await redis.blpop('judger:result', 0)
      if (!blpopResult) {
        continue
      }
      const [ , item ] = blpopResult
      await notifyResult(item)
    } catch (e) {
      logger.error(e)
    }
  }
}

main()
