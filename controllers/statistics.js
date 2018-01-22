const Solution = require('../models/Solution')

// 获取statistics信息
const find = async (ctx) => {
  const opt = ctx.query
  const page = parseInt(opt.page) || 1
  const pageSize = parseInt(opt.pageSize) || 20
  const pid = parseInt(opt.pid)

  // distinct不能喝sort同时使用，故使用聚合
  const list = await Solution.aggregate([
    { $match: {
      pid,
      judge: 3
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
      judge: 3
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

  let countList = []
  for (let i = 2; i <= 10; i++) {
    countList.push(Solution.count({pid, judge: i}).exec())
  }
  countList = await Promise.all(countList)

  const sumStatis = await countList.reduce((sum, item) => sum + item)

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
