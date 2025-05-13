require('dotenv-flow').config()
require('../config/db')

const redis = require('../config/redis')
const logger = require('../utils/logger')

const checkSimilarity = require('./job/checkSimilarity')
const updateStatistic = require('./job/updateStatistic')

async function main () {
  logger.info('Worker is running...')
  while (true) {
    try {
      const [ list, item ] = await redis.blpop(
        'worker:updateStatistic',
        'worker:checkSimilarity',
        0)
      const job = list.slice(list.indexOf(':') + 1)
      const task = [ redis.srem(`worker:${job}:set`, item) ]

      switch (job) {
        case 'checkSimilarity':
          task.push(checkSimilarity(item))
          break
        case 'updateStatistic':
          task.push(updateStatistic(item))
          break
        default:
          logger.warn(`Unknown job <${job}>`)
      }

      await Promise.all(task)
    } catch (e) {
      logger.error(e)
    }
  }
}

main()
