import process from 'node:process'
import { connectMongoose, disconnectMongoose } from '@putong-oj/db'
import { loadConfig } from './config.ts'
import { closeLogger, configureLogger, createLogger } from './logger.ts'
import { Processor } from './queue/processor.ts'

async function main (): Promise<void> {
  const config = loadConfig()
  configureLogger({
    debug: config.debug,
    logFile: config.logFile,
  })

  const logger = createLogger('judger.main')
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
  let stopping = false
  const stop = (): void => {
    if (stopping) {
      return
    }
    stopping = true
    processor.stop()
  }

  process.once('SIGINT', stop)
  process.once('SIGTERM', stop)

  try {
    await processor.run()
  } finally {
    processor.stop()
    logger.info('Processor stopped')
    await disconnectMongoose()
    await closeLogger()
  }
}

main().catch(async (error: unknown) => {
  console.error(error)
  process.exitCode = 1
  await closeLogger()
})
