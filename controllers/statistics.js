const Solution = require('../models/Solution')
const config = require('../config')

// 获取statistics信息
const find = async (ctx) => {
  const opt = ctx.query
  const page = parseInt(opt.page) || 1
  const pageSize = parseInt(opt.pageSize) || 20
  const pid = parseInt(opt.pid) || parseInt(ctx.params.pid)

  // distinct 不能和 sort 同时使用，故使用聚合
  const list = await Solution.aggregate([
    { $match: {
      pid,
      judge: config.judge.Accepted
    }},
    { $sort: {
      time: 1,
      memory: 1,
      length: 1,
      create: 1
    }},
    { $group: {
      _id: '$uid',
      sid: { $first: '$sid' },
      time: { $first: '$time' },
      memory: { $first: '$memory' },
      length: { $first: '$length' },
      language: { $first: '$language' },
      create: { $first: '$create' },
      pid: { $first: '$pid' },
      uid: { $first: '$uid' }
    }},
    {
      $skip: (page - 1) * pageSize
    },
    {
      $limit: pageSize
    }
  ]).exec()

  const sumDoc = await Solution.aggregate([
    { $match: {
      pid,
      judge: config.judge.Accepted
    }},
    { $sort: {
      time: 1,
      memory: 1,
      length: 1,
      create: 1
    }},
    { $group: {
      _id: '$uid',
      sid: { $first: '$sid' },
      time: { $first: '$time' },
      memory: { $first: '$memory' },
      length: { $first: '$length' },
      language: { $first: '$language' },
      create: { $first: '$create' }
    }}
  ]).exec()

  const sumCharts = sumDoc.length

  const countList = []
  for (let i = 2; i <= 10; i++) {
    const count = await Solution.find({pid, judge: i}).distinct('uid').exec()
    countList.push(count.length)
  }

  const sumStatis = countList.reduce((sum, item) => sum + item)

  ctx.body = {
    list,
    sumCharts,
    countList,
    sumStatis
  }
}

module.exports = {
  find
}
