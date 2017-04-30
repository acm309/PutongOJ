const Solution = require('../models/Solution')
const Problem = require('../models/Problem')

async function statistics (ctx, next) {
  const pid = +ctx.params.pid

  if (isNaN(pid)) {
    ctx.throw(400, 'Pid should be a number')
  }

  const problem = await Problem.findOne({pid})

  if (!problem) {
    ctx.throw(400, 'No such a problem')
  }

  // 聚合查询，所有 solutions 里每个用户只出现一次
  // 先按时间升序排列
  const solutions = await Solution.aggregate([
    { $match: {
      pid,
      judge: 3 // TODO: fix this number to a constant variable
    }},
    { $sort: {
      time: 1,
      memory: 1,
      length: 1,
      create: 1
    }},
    { $group: {
      _id: '$uid',
      sid: {$first: '$sid'},
      time: {$first: '$time'},
      memory: {$first: '$memory'},
      length: {$first: '$length'},
      language: {$first: '$language'},
      create: {$first: '$create'}
    }},
    { $sort: {
      time: 1,
      memory: 1,
      length: 1,
      create: 1
    }},
    { $limit: 30 }]).exec()

  let statistics = []
  // TODO: fix this to a constant array with understandable variables
  for (let i = 1; i <= 11; i += 1) {
    statistics.push(
      Solution.count({pid, judge: i}).exec()
    )
  }

  statistics = await Promise.all(statistics)
  statistics = statistics.map((item, index) => ({judge: index, count: item}))

  ctx.body = {
    solutions,
    statistics
  }
}

module.exports = {
  statistics
}
