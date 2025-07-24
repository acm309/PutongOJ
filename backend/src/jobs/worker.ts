import redis from '../config/redis'
import logger from '../utils/logger'
import checkSimilarity from './tasks/checkSimilarity'
import updateStatistic from './tasks/updateStatistic'
import '../config/db'

async function main () {
  logger.info('Worker is running...')
  while (true) {
    try {
      const blpopResult = await redis.blpop(
        'worker:updateStatistic',
        'worker:checkSimilarity',
        0)
      if (!blpopResult) {
        continue
      }

      const [ list, item ] = blpopResult
      const job = list.slice(list.indexOf(':') + 1)
      const task: Promise<any>[] = [ redis.srem(`worker:${job}:set`, item) ]

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
