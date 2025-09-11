import { randomBytes } from 'node:crypto'
import { env } from 'node:process'
import dotenvFlow from 'dotenv-flow'
import constants from '../utils/constants'

dotenvFlow.config()

interface GlobalConfig {
  port: number
  mongodbURL: string
  redisURL: string
  secretKey: string
}

const config: GlobalConfig = {
  port: Number.parseInt(env.PTOJ_WEB_PORT || '3000', 10),
  mongodbURL: env.PTOJ_MONGODB_URL || 'mongodb://localhost:27017/oj',
  redisURL: env.PTOJ_REDIS_URL || 'redis://localhost:6379',
  secretKey: env.PTOJ_SECRET_KEY || randomBytes(16).toString('hex'),
}

export default module.exports = Object.freeze({
  ...config,
  ...constants,
})
