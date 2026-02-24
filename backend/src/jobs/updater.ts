import type { WebSocketDispatch, WebSocketMessage } from '@putongoj/shared'
import { JudgeStatus, WebSocketDispatchType, WebSocketMessageType } from '@putongoj/shared'
import redis from '../config/redis'
import Solution from '../models/Solution'
import logger from '../utils/logger'
import { distributeWork } from './helper'
import '../config/db'

/**
 * @NOTE
 *
 * Updater 用于将 Judger 的结果更新到数据库
 * `judger:result` 的内容需要按序处理
 * 所以只能同时运行一个 Updater 实例
 */

async function updateResult (result: any) {
  const { sid } = result
  const solution = await Solution.findOne({ sid }).exec()
  if (solution == null) {
    logger.warn(`Solution <${sid}> not found`)
    return
  }

  const fields = [ 'time', 'memory', 'testcases', 'judge', 'error' ]
  fields.forEach((field) => {
    if (result[field] !== undefined) {
      (solution as any)[field] = result[field]
    }
  })

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

  await solution.save()
  logger.info(`Solution <${sid}> update to status ${solution.judge}`)

  const tasks = [] as Promise<any>[]
  if (solution.judge !== JudgeStatus.RunningJudge) {
    tasks.push(distributeWork('updateStatistic', `problem:${solution.pid}`))
    tasks.push(distributeWork('updateStatistic', `user:${solution.uid}`))
    tasks.push(redis.publish('websocket:message', JSON.stringify(dispatch)))
  }
  if (solution.judge === JudgeStatus.Accepted) {
    tasks.push(distributeWork('checkSimilarity', solution.sid))
  }
  await Promise.all(tasks)
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
      const result = JSON.parse(item)
      await updateResult(result)
    } catch (e) {
      logger.error(e)
    }
  }
}

main()
