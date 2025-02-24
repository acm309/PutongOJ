require('dotenv-flow').config()
require('../config/db')

const config = require('../config')
const logger = require('../utils/logger')
const redis = require('../config/redis')

const Contest = require('../models/Contest')
const Problem = require('../models/Problem')
const Solution = require('../models/Solution')
const User = require('../models/User')

const UPDATES_QUEUE = 'oj:updates'
const NO_CONTEST = -1

/**
 * 更新排行榜
 */
async function updateRanklist (solution) {
  // cid: Contest, pid: Problem, uid: User
  const { mid: cid, pid, uid } = solution
  if (cid === NO_CONTEST) { return }

  const contest = await Contest.findOne({ cid }).lean().exec()
  if (!contest) {
    logger.error(`Contest <${cid}> not found`)
    return
  }

  const { list: problems, ranklist } = contest
  if (!problems.includes(pid)) {
    logger.warn(`Problem <${pid}> not in contest <${cid}>`)
    return
  }

  // 这个用户在这场比赛第一次提交么？
  if (!ranklist[uid]) { ranklist[uid] = { uid } }

  // 这个用户在这场比赛第一次提交这道题么？
  if (!ranklist[uid][pid]) { ranklist[uid][pid] = {} }

  const grid = ranklist[uid][pid]
  if (grid.create) { return } // 已经有正确提交了

  if (solution.judge === config.judge.Accepted) {
    // 正确的提交
    grid.create = solution.create
    if (!grid.wa) { grid.wa = 0 }
    if (grid.wa < 0) { grid.wa = -grid.wa }
  } else {
    // 错误的提交
    if (!grid.wa) { grid.wa = -1 } else { grid.wa -= 1 }
  }

  await Contest.findOneAndUpdate({ cid }, { ranklist })
  logger.info(`Ranklist of contest <${cid}> updated`)
}

/**
 * 更新用户统计信息
 *
 * 如果用户之前没有提交过这题，那么 user.submit += 1, problem.submit += 1
 * 如果用户之前没有 AC 过这题，那么 user.solved += 1, problem.solved += 1
 */
async function updateStatistic (solution) {
  // pid: Problem, uid: User
  const { pid, sid, uid } = solution
  const [ user, problem ] = await Promise.all([
    User.findOne({ uid }).exec(),
    Problem.findOne({ pid }).exec(),
  ])

  if (!user) {
    logger.error(`User <${uid}> not found`)
    return
  }
  if (!problem) {
    logger.error(`Problem <${pid}> not found`)
    return
  }

  // 这道题之前提交过了么？
  const isSubmittedBefore = await Solution.count({
    uid, pid, sid: { $ne: sid },
  }).exec()
  if (isSubmittedBefore === 0) {
    await Promise.all([
      User.findOneAndUpdate({ uid }, { $inc: { submit: 1 } }).exec(),
      Problem.findOneAndUpdate({ pid }, { $inc: { submit: 1 } }).exec(),
    ])
    logger.info(`User <${uid}> and problem <${pid}> submit count updated`)
  }

  if (solution.judge !== config.judge.Accepted) { return }

  // 这道题之前 AC 过了么？
  const isAcBefore = await Solution.count({
    uid, pid, sid: { $ne: sid },
    judge: config.judge.Accepted,
  }).exec()
  if (isAcBefore === 0) {
    await Promise.all([
      User.findOneAndUpdate({ uid }, { $inc: { solve: 1 } }).exec(),
      Problem.findOneAndUpdate({ pid }, { $inc: { solve: 1 } }).exec(),
    ])
    logger.info(`User <${uid}> and problem <${pid}> solve count updated`)
  }
}

async function process (sid) {
  const solution = await Solution.findOne({ sid }).lean().exec()
  if (solution === null) {
    logger.error(`Solution <${sid}> not found`)
    return
  }
  logger.info(`Processing solution <${sid}>`)
  await Promise.all([
    updateRanklist(solution),
    updateStatistic(solution),
  ])
}

async function main () {
  logger.info('Updater is running...')
  while (true) {
    try {
      const item = await redis.brpop(UPDATES_QUEUE, 0)
      const sid = Number.parseInt(item[1])
      await process(sid)
    } catch (e) {
      logger.error(e)
    }
  }
}

main()
