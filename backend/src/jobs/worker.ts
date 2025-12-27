import redis from '../config/redis'
import logger from '../utils/logger'
import checkSimilarity from './tasks/checkSimilarity'
import fetchCodeforces from './tasks/fetchCodeforces'
import updateStatistic from './tasks/updateStatistic'
import '../config/db'

async function main () {
  logger.info('Worker is running...')
  while (true) {
    try {
      const blpopResult = await redis.blpop(
        'worker:updateStatistic',
        'worker:checkSimilarity',
        'worker:fetchCodeforces',
        0)
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
            await fetchCodeforces(item)
            break
          default:
            logger.warn(`Unknown job <${job}>`)
        }
      } finally {
        await redis.srem(`worker:${job}:set`, item)
      }
    } catch (e) {
      logger.error(e)
    }
  }
}

main()
