require('dotenv-flow').config()
require('../config/db')

const levenshtein = require('damerau-levenshtein')

const { judge } = require('../config')
const logger = require('../utils/logger')
const redis = require('../config/redis')

const Solution = require('../models/Solution')

function codeNormalize (code) {
  return code
    .replace(/\/\/.*|\/\*[\s\S]*?\*\//g, '')
    .replace(/[a-z_]\w*/gi, 'VAR')
    .replace(/\s+/g, ' ')
    .trim()
}

async function similarityCheck (sid) {
  const solution = await Solution.findOne({ sid }).exec()
  if (!solution) {
    logger.error(`Solution <${sid}> not found`)
    return
  }

  const solutions = await Solution.find({
    pid: solution.pid,
    uid: { $ne: solution.uid },
    language: solution.language,
    create: { $lt: solution.create },
    judge: judge.Accepted,
  }).lean().exec()

  const code = codeNormalize(solution.code)
  const result = { sim: 0, sim_s_id: 0 }
  for (const s of solutions) {
    const lev = levenshtein(code, codeNormalize(s.code))
    if (lev.similarity > result.sim) {
      result.sim = lev.similarity
      result.sim_s_id = s.sid
    }
  }

  if (result.sim < 0.5) { return }
  solution.sim = Math.round(result.sim * 100)
  solution.sim_s_id = result.sim_s_id
  await solution.save()
  logger.info(`Solution <${sid}> has similarity with <${result.sim_s_id}>`)
}

async function main () {
  logger.info('Updater is running...')
  while (true) {
    try {
      const item = await redis.blpop('checker:task', 0)
      const sid = Number(item[1])
      await similarityCheck(sid)
    } catch (e) {
      logger.error(e)
    }
  }
}

main()
