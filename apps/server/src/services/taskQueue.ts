import redis from '../config/redis.ts'
import { createLogger } from '../utils/logger.ts'
import '../config/db.ts'

const logger = createLogger('server.task-queue')

export async function distributeWork (task: string, id: string | number) {
  const taskList = `worker:${task}`
  const taskSet = `worker:${task}:set`

  id = String(id)

  const exists = await redis.sismember(taskSet, id)
  if (exists) {
    logger.debug({ id, task }, 'Task already exists')
    return
  }

  await redis.multi().sadd(taskSet, id).rpush(taskList, id).exec()
  logger.debug({ id, task }, 'Task added')
}
