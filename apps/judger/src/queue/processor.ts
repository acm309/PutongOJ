import type { JudgerResult } from '@putong-oj/shared'
import type { JudgerConfig } from '../config.ts'
import type { Scheduler } from './scheduler.ts'
import { JudgeStatus } from '@putong-oj/shared'
import { Redis } from 'ioredis'
import { RESULT_QUEUE_NAME, TASK_QUEUE_NAME } from '../constants.ts'
import { Judger } from '../judge/judger.ts'
import { createLogger } from '../logger.ts'
import { SandboxClient } from '../sandbox/client.ts'
import { loadJudgerTask, saveJudgerResult } from '../services/submission.ts'

export class Processor {
  private readonly idx: number
  private readonly scheduler: Scheduler
  private readonly config: JudgerConfig
  private readonly logger = createLogger('judger.processor')
  private readonly redis: Redis
  private readonly client: SandboxClient

  constructor (
    scheduler: Scheduler,
    idx: number,
    config: JudgerConfig,
  ) {
    this.scheduler = scheduler
    this.idx = idx
    this.config = config
    this.redis = new Redis(config.redisOptions)
    this.client = new SandboxClient(config.sandboxEndpoint)
    this.logger.debug(`Processor ${this.idx} initialized`)
  }

  async connect (): Promise<void> {
    if (this.redis.status === 'wait') {
      await this.redis.connect()
    }
  }

  async close (): Promise<void> {
    await this.client.close()
    if (this.redis.status === 'ready' || this.redis.status === 'connect') {
      await this.redis.quit()
    } else {
      this.redis.disconnect()
    }
    this.logger.debug(`Processor ${this.idx} closed`)
  }

  async getSolutionId (): Promise<string | undefined> {
    while (this.scheduler.isRunning()) {
      const popValue = await this.redis.blpop(
        TASK_QUEUE_NAME,
        5,
      )
      if (popValue === null) {
        continue
      }

      const [ , value ] = popValue
      this.logger.debug(`Processor ${this.idx} popped ${value}`)
      return value.trim()
    }
    return undefined
  }

  async putResult (solutionId: string): Promise<void> {
    try {
      this.logger.debug(
        `Processor ${this.idx} notifying solution ${solutionId}`,
      )
      await this.redis.rpush(
        RESULT_QUEUE_NAME,
        solutionId,
      )
    } catch (error) {
      this.logger.error(
        `Processor ${this.idx} failed to enqueue result for ${solutionId}:`,
        error,
      )
    }
  }

  async process (): Promise<void> {
    const solutionId = await this.getSolutionId()
    if (solutionId === undefined) {
      return
    }

    this.logger.debug(
      `Processor ${this.idx} processing solution ${solutionId}`,
    )
    const startTime = performance.now()

    try {
      const submission = await loadJudgerTask(solutionId, this.config)
      if (!submission) {
        return
      }

      const runningResult: JudgerResult = {
        sid: submission.sid,
        time: 0,
        memory: 0,
        testcases: [],
        judge: JudgeStatus.RunningJudge,
        error: '',
      }
      await saveJudgerResult(solutionId, runningResult)
      await this.putResult(solutionId)

      const judger = new Judger(this.client, submission)
      const result = await judger.getResult()
      await saveJudgerResult(solutionId, result)
      await this.putResult(solutionId)

      const elapsedSeconds = (performance.now() - startTime) / 1000
      this.logger.info(
        `Processor ${this.idx} finished submission ${submission.sid} `
        + `with result ${JudgeStatus[result.judge]} in ${elapsedSeconds} seconds`,
      )
    } catch (error) {
      this.logger.error(
        `Processor ${this.idx} failed solution ${solutionId}:`,
        error,
      )
      const result: JudgerResult = {
        sid: 0,
        time: 0,
        memory: 0,
        testcases: [],
        judge: JudgeStatus.SystemError,
        error: '',
      }
      try {
        await saveJudgerResult(solutionId, result)
      } catch (saveError) {
        this.logger.error(
          `Processor ${this.idx} failed to save system error for ${solutionId}:`,
          saveError,
        )
      }
      await this.putResult(solutionId)
    }
  }

  async run (): Promise<void> {
    this.logger.debug(`Processor ${this.idx} started`)
    await this.connect()
    try {
      while (this.scheduler.isRunning()) {
        await this.process()
      }
    } finally {
      await this.close()
    }
    this.logger.debug(`Processor ${this.idx} stopped`)
  }
}
