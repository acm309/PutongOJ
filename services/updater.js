require('dotenv-flow').config()
require('../config/db')

const { judge } = require('../config')
const redis = require('../config/redis')
const Solution = require('../models/Solution')
const logger = require('../utils/logger')

/**
 * @NOTE
 *
 * Updater 用于将 Judger 的结果更新到数据库
 * `judger:result` 的内容需要按序处理
 * 所以只能同时运行一个 Updater 实例
 */

/**
 * 将任务推送至任务对应的去重队列
 * @param {string} task 任务名称
 * @param {any} id 项目 ID
 */
async function distributeWork (task, id) {
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

async function updateResult (result) {
  const { sid } = result
  const solution = await Solution.findOne({ sid }).exec()
  if (solution == null) {
    logger.warn(`Solution <${sid}> not found`)
    return
  }

  const fields = [ 'time', 'memory', 'testcases', 'judge', 'error' ]
  fields.forEach((field) => {
    if (result[field] !== undefined) {
      solution[field] = result[field]
    }
  })

  const tasks = [
    solution.save().then(() => {
      logger.info(`Solution <${sid}> update to status ${solution.judge}`)
    }),
  ]
  if (solution.judge !== judge.Running) {
    tasks.push(distributeWork('updateStatistic', `problem:${solution.pid}`))
    tasks.push(distributeWork('updateStatistic', `user:${solution.uid}`))
  }
  if (solution.judge === judge.Accepted) {
    tasks.push(distributeWork('checkSimilarity', solution.sid))
  }
  await Promise.all(tasks)
}

async function main () {
  logger.info('Updater is running...')
  while (true) {
    try {
      const [ , item ] = await redis.blpop('judger:result', 0)
      const result = JSON.parse(item)
      await updateResult(result)
    } catch (e) {
      logger.error(e)
    }
  }
}

main()
