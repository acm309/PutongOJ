import type { WebSocketDispatch, WebSocketMessage } from '@putong-oj/shared'
import type { JudgerConfig } from '../config.ts'
import { Solution } from '@putong-oj/db'
import { JudgeStatus, WEBSOCKET_CHANNEL, WebSocketDispatchType, WebSocketMessageType } from '@putong-oj/shared'
import { Redis } from 'ioredis'
import { RESULT_QUEUE_NAME } from '../constants.ts'
import { createLogger } from '../logger.ts'

export class Updater {
  private readonly redis: Redis
  private readonly logger = createLogger('judger.updater')
  private running = true

  constructor (config: JudgerConfig) {
    this.redis = new Redis(config.redisOptions)
  }

  async connect (): Promise<void> {
    if (this.redis.status === 'wait') {
      await this.redis.connect()
    }
  }

  async close (): Promise<void> {
    if (this.redis.status === 'ready' || this.redis.status === 'connect') {
      await this.redis.quit()
    } else {
      this.redis.disconnect()
    }
  }

  async distributeWork (task: string, id: string | number): Promise<void> {
    const taskList = `worker:${task}`
    const taskSet = `worker:${task}:set`
    const item = String(id)

    const exists = await this.redis.sismember(taskSet, item)
    if (exists) {
      this.logger.debug({ item, task }, 'Worker task already exists')
      return
    }

    await this.redis.multi().sadd(taskSet, item).rpush(taskList, item).exec()
    this.logger.debug({ item, task }, 'Worker task added')
  }

  async notifyResult (solutionId: string): Promise<void> {
    const solution = await Solution.findOne({ _id: solutionId }).lean().exec()
    if (solution == null) {
      this.logger.warn({ solutionId }, 'Solution not found')
      return
    }
    if (solution.judge === JudgeStatus.RunningJudge) {
      return
    }

    const message: WebSocketMessage = {
      type: WebSocketMessageType.SubmissionResult,
      data: {
        solutionId: solution.sid,
        judgeStatus: solution.judge as JudgeStatus,
      },
    }
    const dispatch: WebSocketDispatch = {
      type: WebSocketDispatchType.User,
      username: solution.uid,
      message,
    }

    const tasks: Promise<unknown>[] = [
      this.distributeWork('updateStatistic', `problem:${solution.pid}`),
      this.distributeWork('updateStatistic', `user:${solution.uid}`),
      this.redis.publish(WEBSOCKET_CHANNEL, JSON.stringify(dispatch)),
    ]
    if (solution.judge === JudgeStatus.Accepted) {
      tasks.push(this.distributeWork('checkSimilarity', solution.sid))
    }
    await Promise.all(tasks)
    this.logger.info(
      {
        judge: solution.judge,
        solutionId: solution.sid,
      },
      'Notified solution result',
    )
  }

  stop (): void {
    this.running = false
  }

  async run (): Promise<void> {
    this.logger.debug('Updater started')
    await this.connect()
    try {
      while (this.running) {
        try {
          const blpopResult = await this.redis.blpop(RESULT_QUEUE_NAME, 5)
          if (!blpopResult) {
            continue
          }
          const [ , item ] = blpopResult
          await this.notifyResult(item)
        } catch (error) {
          this.logger.error({ err: error }, 'Updater failed')
        }
      }
    } finally {
      await this.close()
    }
    this.logger.debug('Updater stopped')
  }
}
