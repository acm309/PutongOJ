import redis from '../config/redis'
import logger from '../utils/logger'
import '../config/db'

export async function distributeWork (task: string, id: string | number) {
  const taskList = `worker:${task}`
  const taskSet = `worker:${task}:set`

  id = String(id)

  const exists = await redis.sismember(taskSet, id)
  if (exists) {
    logger.debug(`Task <${task}> for <${id}> already exists`)
    return
  }

  await redis.multi().sadd(taskSet, id).rpush(taskList, id).exec()
  logger.debug(`Task <${task}> for <${id}> added`)
}
