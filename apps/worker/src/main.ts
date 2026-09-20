import process from 'node:process'
import { connectMongoose, disconnectMongoose } from '@putong-oj/db'
import { Redis } from 'ioredis'
import { loadWorkerConfig } from './config.ts'
import { createLogger } from './logger.ts'
import checkSimilarity from './tasks/checkSimilarity.ts'
import fetchCodeforces from './tasks/fetchCodeforces.ts'
import scanUploadsFolder from './tasks/scanUploadsFolder.ts'
import updateStatistic from './tasks/updateStatistic.ts'

const JOB_QUEUES = [
  'worker:updateStatistic',
  'worker:checkSimilarity',
  'worker:fetchCodeforces',
  'worker:scanUploadsFolder',
]

const logger = createLogger('worker.main')

async function main (): Promise<void> {
  const config = loadWorkerConfig()

  logger.info(
    {
      mongoDatabase: new URL(config.mongodbURL).pathname,
      redisURL: config.redisURL,
      uploadDir: config.uploadDir,
    },
    'Worker starting',
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

  const redis = new Redis(config.redisOptions)
  await redis.connect()

  let stopping = false
  const stop = (): void => {
    stopping = true
  }
  process.once('SIGINT', stop)
  process.once('SIGTERM', stop)

  try {
    while (true) {
      if (stopping) {
        break
      }

      try {
        const blpopResult = await redis.blpop(...JOB_QUEUES, 5)
        if (!blpopResult) {
          continue
        }

        const [ list, item ] = blpopResult
        const job = list.slice(list.indexOf(':') + 1)

        try {
          switch (job) {
            case 'checkSimilarity':
              await checkSimilarity(item)
              break
            case 'updateStatistic':
              await updateStatistic(item)
              break
            case 'fetchCodeforces':
              await fetchCodeforces(redis, item)
              break
            case 'scanUploadsFolder':
              await scanUploadsFolder(config.uploadDir)
              break
            default:
              logger.warn({ job }, 'Unknown job')
          }
        } finally {
          await redis.srem(`worker:${job}:set`, item)
        }
      } catch (error) {
        logger.error({ err: error }, 'Worker job failed')
      }
    }
  } finally {
    if (redis.status === 'ready' || redis.status === 'connect') {
      await redis.quit()
    } else {
      redis.disconnect()
    }
    logger.info('Worker stopped')
    await disconnectMongoose()
  }
}

main().catch((error: unknown) => {
  logger.error({ err: error }, 'Worker failed')
  process.exitCode = 1
})
