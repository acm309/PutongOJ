import redis from '../config/redis.ts'
import logger from '../utils/logger.ts'
import checkSimilarity from './tasks/checkSimilarity.ts'
import fetchCodeforces from './tasks/fetchCodeforces.ts'
import scanUploadsFolder from './tasks/scanUploadsFolder.ts'
import updateStatistic from './tasks/updateStatistic.ts'
import '../config/db.ts'

async function main () {
  logger.info('Worker is running...')
  while (true) {
    try {
      const blpopResult = await redis.blpop(
        'worker:updateStatistic',
        'worker:checkSimilarity',
        'worker:fetchCodeforces',
        'worker:scanUploadsFolder',
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
          case 'scanUploadsFolder':
            await scanUploadsFolder()
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
