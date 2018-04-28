require('../config/db')
const Solution = require('../models/Solution')
const Contest = require('../models/Contest')
const logger = require('../utils/logger')
const config = require('../config')
const redis = require('../config/redis')

async function main () {
  while (1) {
    const res = await redis.brpop('oj:contest:solution', 365 * 24 * 60) // one year
    const sid = parseInt(res[1])
    const solution = await Solution.findOne({ sid }).exec()
    const { uid, pid } = solution
    const contest = await Contest.findOne({ cid: solution.mid }).exec()
    logger.info(`Contest: <${contest.cid}>, Solution: <${sid}>, User: <${uid}>, Problem: <${pid}>`)
    const { ranklist } = contest
    if (ranklist[uid] == null) { // 这个用户在这场比赛中第一次提交
      ranklist[uid] = { uid }
    }
    if (ranklist[uid][pid] == null) { // 这个用户在这场比赛第一次提交这道题
      ranklist[uid][pid] = {}
    }
    const grid = ranklist[uid][pid]
    if (solution.judge === config.judge.Accepted) {
      if (grid.wa == null) { // 第一次提交就作对了
        grid.wa = 0
        grid.create = Date.now()
      } else if (grid.wa < 0) { // 为了避免出现：已经作对了，有提交该题的情况
        grid.wa = -grid.wa
        grid.create = Date.now()
      }
    } else { // 做错
      if (grid.wa == null) { // 第一次提交就做错了
        grid.wa = -1
      } else if (grid.wa < 0) { // 同样，如果 > 0 则代表用户已经作对了，所以对 > 0 的不处理
        grid.wa -= 1
      }
    }
    ranklist[uid][pid] = grid
    contest.ranklist = ranklist
    await contest.save()
  }
}

main()
  .then(() => logger.info('Started!'))
  .catch((e) => logger.error(`${e.message}\n${e.stack}`))
