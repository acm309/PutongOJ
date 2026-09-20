import process from 'node:process'
import { connectMongoose } from '@putong-oj/db'
import { createLogger } from '../utils/logger.ts'
import config from './index.ts'

const logger = createLogger('server.db')

void connectMongoose({
  uri: config.mongodbURL,
  debug: config.mongooseDebug,
  onConnected: () => {
    logger.info('MongoDB connected successfully')
  },
  onError: (err) => {
    logger.error({ err }, 'MongoDB connection failed')
    process.exit(-1)
  },
  onDisconnected: () => {
    logger.error('MongoDB disconnected')
  },
}).catch((err) => {
  logger.error({ err }, 'MongoDB connection failed')
  process.exit(-1)
})
