const redis = require('redis')
const config = require('../../config/')
const client = redis.createClient(config.redisUrl)
const mongoose = require('mongoose')
mongoose.Promise = global.Promise
mongoose.connect(config.mongoUrl)

const Solution = require('../../models/Solution')
const User = require('../../models/User')
const Problem = require('../../models/Problem')
const Contest = require('../../models/Contest')
const logger = require('winston')

logger.default.transports.console.colorize = true

logger.info('Start successfully')

function brpop (...args) {
  return new Promise((resolve, reject) => {
    client.brpop(...args, function(err, res) {
      if (err) reject(err)
      resolve(res)
    })
  })
}

async function fetchSid (tag) {
  const result = await brpop(tag, 3600 * 24 * 365)
  if (result === null) {
    logger.error('Wait for too long time...')
    process.exit(-1)
  }
  return +result[1]
}

async function run () {
  const sid = await fetchSid('contests')
  const solution = await Solution.findOne({ sid }).exec()
  if (solution.module !== config.module.Contest) {
    logger.warn(`Solution ${solution.sid} is a solution for a contest problem`)
  }
  const cid = solution.mid
  const contest = await Contest.findOne({ cid }).exec()
  await Promise.all([
          contest.fetchRanklist(solution),
          contest.fetchOverview(solution)
  ])
  logger.info(`Success updated for contest ${contest.cid}`)
}

async function main () {
  while (1) {
    try {
      await run()
    } catch (e) {
      logger.error(e)
    }
  }
}

main()
