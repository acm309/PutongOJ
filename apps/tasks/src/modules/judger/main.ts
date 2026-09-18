import process from 'node:process'
import { connectMongoose, disconnectMongoose } from '@putong-oj/db'
import { createLogger } from '../../logger.ts'
import { loadJudgerConfig } from './config.ts'
import { Processor } from './queue/processor.ts'
import { Updater } from './queue/updater.ts'

const logger = createLogger('judger.main')

async function main (): Promise<void> {
  const config = loadJudgerConfig()

  logger.info(
    {
      mongoDatabase: new URL(config.mongodbURL).pathname,
      redisURL: config.redisURL,
      sandboxEndpoint: config.sandboxEndpoint,
      dataDir: config.dataDir,
    },
    'Judger starting',
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
      logger.error({ err: error }, 'MongoDB error')
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
    logger.info('Judger stopped')
    await disconnectMongoose()
  }
}

main().catch((error: unknown) => {
  logger.error({ err: error }, 'Judger failed')
  process.exitCode = 1
})
