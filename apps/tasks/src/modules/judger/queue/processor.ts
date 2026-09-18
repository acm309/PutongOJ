import type { JudgerResult } from '@putong-oj/shared'
import type { JudgerConfig } from '../config.ts'
import { JudgeStatus } from '@putong-oj/shared'
import { Redis } from 'ioredis'
import { createLogger } from '../../../logger.ts'
import { RESULT_QUEUE_NAME, TASK_QUEUE_NAME } from '../constants.ts'
import { Judger } from '../judge/judger.ts'
import { SandboxClient } from '../sandbox/client.ts'
import { loadJudgerTask, saveJudgerResult } from '../services/submission.ts'

export class Processor {
  private readonly config: JudgerConfig
  private readonly logger = createLogger('judger.processor')
  private readonly redis: Redis
  private readonly client: SandboxClient
  private running = true

  constructor (config: JudgerConfig) {
    this.config = config
    this.redis = new Redis(config.redisOptions)
    this.client = new SandboxClient(config.sandboxEndpoint)
    this.logger.debug('Processor initialized')
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
    this.logger.debug('Processor closed')
  }

  async getSolutionId (): Promise<string | undefined> {
    while (this.running) {
      const popValue = await this.redis.blpop(
        TASK_QUEUE_NAME,
        5,
      )
      if (popValue === null) {
        continue
      }

      const [ , value ] = popValue
      this.logger.debug({ value }, 'Processor popped task')
      return value.trim()
    }
    return undefined
  }

  async putResult (solutionId: string): Promise<void> {
    try {
      this.logger.debug({ solutionId }, 'Processor notifying solution')
      await this.redis.rpush(
        RESULT_QUEUE_NAME,
        solutionId,
      )
    } catch (error) {
      this.logger.error(
        { err: error, solutionId },
        'Processor failed to enqueue result',
      )
    }
  }

  async process (): Promise<void> {
    const solutionId = await this.getSolutionId()
    if (solutionId === undefined) {
      return
    }

    this.logger.debug({ solutionId }, 'Processor processing solution')
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
        {
          elapsedSeconds,
          judge: JudgeStatus[result.judge],
          solutionId: submission.sid,
        },
        'Processor finished submission',
      )
    } catch (error) {
      this.logger.error(
        { err: error, solutionId },
        'Processor failed solution',
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
          { err: saveError, solutionId },
          'Processor failed to save system error',
        )
      }
      await this.putResult(solutionId)
    }
  }

  stop (): void {
    this.running = false
  }

  async run (): Promise<void> {
    this.logger.debug('Processor started')
    await this.connect()
    try {
      while (this.running) {
        await this.process()
      }
    } finally {
      await this.close()
    }
    this.logger.debug('Processor stopped')
  }
}
