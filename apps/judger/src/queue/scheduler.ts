import type { JudgerConfig } from '../config.ts'
import { createLogger } from '../logger.ts'
import { Processor } from './processor.ts'

export class Scheduler {
  private readonly config: JudgerConfig
  private readonly logger = createLogger('judger.scheduler')
  private processors: Promise<void>[] = []
  private running = false

  constructor (config: JudgerConfig) {
    this.config = config
    this.logger.debug(
      'Scheduler initialized with '
      + `redis_url=${config.redisURL}, `
      + `sandbox_endpoint=${config.sandboxEndpoint}, `
      + `init_concurrent=${config.initConcurrent}`,
    )
  }

  isRunning (): boolean {
    return this.running
  }

  start (): void {
    this.logger.debug('Scheduler starting...')
    this.running = true
    this.processors = Array.from(
      { length: this.config.initConcurrent },
      (_, index) => new Processor(this, index, this.config).run(),
    )
  }

  async wait (): Promise<void> {
    await Promise.all(this.processors)
  }

  async stop (): Promise<void> {
    if (!this.running) {
      return
    }

    this.logger.debug('Scheduler stopping...')
    this.running = false
    await this.wait()
    this.logger.debug('Scheduler stopped')
  }
}
