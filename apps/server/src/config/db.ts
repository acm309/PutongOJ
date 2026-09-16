import process from 'node:process'
import { connectMongoose } from '@putong-oj/db'
import logger from '../utils/logger.ts'
import config from './index.ts'

void connectMongoose({
  uri: config.mongodbURL,
  debug: config.mongooseDebug,
  onConnected: () => {
    logger.info('MongoDB connected successfully')
  },
  onError: (err) => {
    logger.error('MongoDB connected failed')
    logger.error(err)
    process.exit(-1)
  },
  onDisconnected: () => {
    logger.error('MongoDB disconnected')
  },
}).catch((err) => {
  logger.error('MongoDB connected failed')
  logger.error(err)
  process.exit(-1)
})
