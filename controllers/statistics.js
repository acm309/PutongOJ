const Solution = require('../models/Solution')

/**
  针对某一题的排名
  以时间为第一维度，内存为第二维度，长度为第三维度，提交时间为第四维度
  以上均以升序为标准
  聚合算法参考自: https://github.com/KIDx/ACdream/blob/master/routers/statistic.js
*/
async function statistics (ctx, next) {
  const pid = +ctx.params.pid

  // 聚合查询，所有 solutions 里每个用户只出现一次
  const solutions = await Solution.aggregate([
    { $match: {
      pid,
      judge: ctx.config.judge.Accepted
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
      create: {$first: '$create'},
      pid: {$first: '$pid'},
      uid: {$first: '$uid'}
    }},
    { $sort: {
      time: 1,
      memory: 1,
      length: 1,
      create: 1
    }},
    { $limit: 30 }]).exec()

  let counted = []
  // TODO: fix this to a constant array with understandable variables
  for (let i = 2; i <= 9; i += 1) {
    counted.push(
      Solution.count({pid, judge: i}).exec()
    )
  }

  counted = await Promise.all(counted)

  const statistics = {}
  // i means the judge result, counted[i - 1] represents corresponding count
  for (let i = 2; i <= 9; i += 1) {
    statistics[i] = counted[i - 2]
  }

  ctx.body = {
    solutions,
    statistics
  }
}

module.exports = {
  statistics
}
