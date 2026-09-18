import type { JudgerResult, JudgerTask } from '@putong-oj/shared'
import type { JudgerConfig } from '../config.ts'
import type { Scheduler } from './scheduler.ts'
import { JudgerTaskSchema, JudgeStatus } from '@putong-oj/shared'
import { Redis } from 'ioredis'
import { RESULT_QUEUE_NAME, TASK_QUEUE_NAME } from '../constants.ts'
import { Judger } from '../judge/judger.ts'
import { createLogger } from '../logger.ts'
import { SandboxClient } from '../sandbox/client.ts'

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

  async getSubmission (): Promise<JudgerTask | undefined> {
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
      return JudgerTaskSchema.parse(JSON.parse(value))
    }
    return undefined
  }

  async putResult (result: JudgerResult): Promise<void> {
    this.logger.debug(`Processor ${this.idx} putting result`, result)
    await this.redis.rpush(
      RESULT_QUEUE_NAME,
      JSON.stringify(result),
    )
  }

  async process (): Promise<void> {
    const submission = await this.getSubmission()
    if (!submission) {
      return
    }

    this.logger.debug(
      `Processor ${this.idx} processing submission ${submission.sid}`,
    )
    const startTime = performance.now()
    await this.putResult({
      sid: submission.sid,
      time: 0,
      memory: 0,
      testcases: [],
      judge: JudgeStatus.RunningJudge,
      error: '',
    })

    try {
      const judger = new Judger(this.client, submission)
      const result = await judger.getResult()
      await this.putResult(result)

      const elapsedSeconds = (performance.now() - startTime) / 1000
      this.logger.info(
        `Processor ${this.idx} finished submission ${submission.sid} `
        + `with result ${JudgeStatus[result.judge]} in ${elapsedSeconds} seconds`,
      )
    } catch (error) {
      this.logger.error(
        `Processor ${this.idx} failed submission ${submission.sid}:`,
        error,
      )
      await this.putResult({
        sid: submission.sid,
        time: 0,
        memory: 0,
        testcases: [],
        judge: JudgeStatus.SystemError,
        error: '',
      })
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
