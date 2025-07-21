import { randomBytes } from 'node:crypto'
import { env } from 'node:process'
import dotenvFlow from 'dotenv-flow'
import constants from '../utils/constants'

dotenvFlow.config()

const config = {
  port: Number.parseInt(env.PORT as string) || 3000,
  dbURL: String(env.dbURL || 'mongodb://localhost:27017/oj'),
  redisURL: String(env.redisURL || 'redis://localhost:6379'),
  secretKey: String(env.secretKey || randomBytes(16).toString('hex')),
}

export default module.exports = Object.freeze({
  ...config,
  ...constants,
})
