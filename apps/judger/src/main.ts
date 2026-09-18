import process from 'node:process'
import { loadConfig } from './config.ts'
import { closeLogger, configureLogger, createLogger } from './logger.ts'
import { Scheduler } from './queue/scheduler.ts'

async function main (): Promise<void> {
  const config = loadConfig()
  configureLogger({
    debug: config.debug,
    logFile: config.logFile,
  })

  const logger = createLogger('judger.main')
  logger.info(
    'Starting with '
    + `redis_url=${config.redisURL}, `
    + `sandbox_endpoint=${config.sandboxEndpoint}, `
    + `init_concurrent=${config.initConcurrent}, `
    + `log_file='${config.logFile}'`,
  )

  const scheduler = new Scheduler(config)
  let stopping = false
  const stop = async (): Promise<void> => {
    if (stopping) {
      return
    }
    stopping = true
    await scheduler.stop()
  }

  process.once('SIGINT', () => {
    void stop()
  })
  process.once('SIGTERM', () => {
    void stop()
  })

  scheduler.start()
  try {
    await scheduler.wait()
  } finally {
    await scheduler.stop()
    logger.info('Scheduler stopped')
    await closeLogger()
  }
}

main().catch(async (error: unknown) => {
  console.error(error)
  process.exitCode = 1
  await closeLogger()
})
