import process from 'node:process'
import { connectMongoose, disconnectMongoose } from '@putong-oj/db'
import { loadConfig } from './config.ts'
import { closeLogger, configureLogger, createLogger } from './logger.ts'
import { Processor } from './queue/processor.ts'
import { Updater } from './queue/updater.ts'

async function main (): Promise<void> {
  const config = loadConfig()
  configureLogger({
    debug: config.debug,
    logFile: config.logFile,
  })

  const logger = createLogger('tasks.main')
  logger.info(
    'Starting with '
    + `mongo_db='${new URL(config.mongodbURL).pathname}', `
    + `redis_url=${config.redisURL}, `
    + `sandbox_endpoint=${config.sandboxEndpoint}, `
    + `data_dir='${config.dataDir}', `
    + `log_file='${config.logFile}'`,
  )

  await connectMongoose({
    uri: config.mongodbURL,
    onConnected: () => {
      logger.info('MongoDB connected successfully')
    },
    onDisconnected: () => {
      logger.warn('MongoDB disconnected')
    },
    onError: (error) => {
      logger.error('MongoDB error:', error)
    },
  })

  const processor = new Processor(config)
  const updater = new Updater(config)
  let stopping = false
  const stop = (): void => {
    if (stopping) {
      return
    }
    stopping = true
    processor.stop()
    updater.stop()
  }

  process.once('SIGINT', stop)
  process.once('SIGTERM', stop)

  const running = [
    processor.run(),
    updater.run(),
  ]
  try {
    await Promise.all(running)
  } finally {
    processor.stop()
    updater.stop()
    await Promise.allSettled(running)
    logger.info('Tasks stopped')
    await disconnectMongoose()
    await closeLogger()
  }
}

main().catch(async (error: unknown) => {
  console.error(error)
  process.exitCode = 1
  await closeLogger()
})
