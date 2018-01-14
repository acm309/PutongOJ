const only = require('only')
const Contest = require('../models/Contest')
const Problem = require('../models/Problem')
const Solution = require('../models/Solution')
const User = require('../models/User')
const logger = require('../utils/logger')
const config = require('../config')

// 返回竞赛列表
const list = async (ctx) => {
  const opt = ctx.request.query
  const page = parseInt(opt.page) || 1
  const pageSize = parseInt(opt.pageSize) || 20
  const res = await Contest.paginate({}, {
    sort: { cid: -1 },
    page,
    limit: pageSize
  })

  const uid = opt.uid
  let solved = []
  solved = await Solution
    .find({ uid, judge: 3 })
    .distinct('pid')
    .exec()

  ctx.body = {
    res,
    solved
  }
}

// 返回一个竞赛
const findOne = async (ctx) => {
  const opt = ctx.request.query
  const cid = parseInt(opt.cid)
  const doc = await Contest.findOne({ cid }).exec()

  const list = doc.list
  const total = list.length
  let res = []
  const process = list.map((pid, index) => {
    return Problem.findOne({pid}).exec()
      .then((problem) => {
        res[index] = only(problem, 'title pid')
      })
      .then(() => {
        return Solution.count({pid, mid: cid}).exec()
      })
      .then((count) => {
        res[index].submit = count
      })
      .then(() => {
        return Solution.count({pid, mid: cid, judge: 3}).exec()
      })
      .then((count) => {
        res[index].solve = count
      })
  })
  await Promise.all(process)

  let pro = []
  res.forEach((value, index) => {
    pro.push(res[index].pid)
  })

  ctx.body = {
    doc,
    res,
    total,
    pro
  }
}

// 返回比赛排行榜
// https://paste.ubuntu.com/26296673/
// 注意将 paste ubuntu 中的几处错误:
// 1. created 改为 create
// 2. 没有 ac 的题目是没有 create 属性的
const ranklist = async (ctx) => {
  const ranklist = {}
  const cid = parseInt(ctx.query.cid)
  const solutions = await Solution.find({
    mid: cid
  })
  for (const solution of solutions) {
    const { uid } = solution
    const row = (uid in ranklist) ? ranklist[uid] : { uid }
    const { pid } = solution
    const item = (pid in row) ? row[pid] : {}
    if ('wa' in item) {
      if (item.wa >= 0) continue
      if (solution.judge === config.judge.Accepted) {
        item.wa = -item.wa
        item.create = solution.create
      } else item.wa --
    } else {
      if (solution.judge === config.judge.Accepted) {
        item.wa = 0
        item.create = solution.create
      } else item.wa = -1
    }
    row[pid] = item
    ranklist[uid] = row
  }
  await Promise.all(Object.keys(ranklist).map((uid) =>
      User
        .findOne({ uid })
        .exec()
        .then(user => { ranklist[user.uid].nick = user.nick })))
  ctx.body = {
    ranklist
  }
}

// 新建一个比赛
const create = async (ctx) => {
  const opt = ctx.request.body

  const contest = new Contest(Object.assign(
    only(opt, 'title encrypt list argument'),
    { // cid 会自动生成
      start: new Date(opt.start).getTime(),
      end: new Date(opt.end).getTime(),
      create: Date.now()
    }
  ))

  try {
    await contest.save()
    logger.info(`New problem is created" ${contest.cid} -- ${contest.title}`)
  } catch (e) {
    ctx.throw(400, e.message)
  }

  ctx.body = {
    success: true,
    cid: contest.cid
  }
}

// 更新一个比赛
const update = async (ctx) => {
  const opt = ctx.request.body
  const contest = await Contest.findOne({cid: opt.cid}).exec()
  const fileds = ['title', 'encrypt', 'list', 'argument', 'start', 'end', 'status']
  opt.start = new Date(opt.start).getTime()
  opt.end = new Date(opt.end).getTime()
  fileds.forEach((filed) => {
    contest[filed] = opt[filed]
  })
  try {
    await contest.save()
    logger.info(`One problem is updated" ${contest.cid} -- ${contest.title}`)
  } catch (e) {
    ctx.throw(400, e.message)
  }

  ctx.body = {
    success: true,
    cid: contest.cid
  }
}

// 删除一个比赛
const del = async (ctx) => {
  const cid = ctx.params.cid

  try {
    await Contest.deleteOne({cid}).exec()
    logger.info(`One Contest is delete ${cid}`)
  } catch (e) {
    ctx.throw(400, e.message)
  }

  ctx.body = {}
}

module.exports = {
  list,
  findOne,
  ranklist,
  create,
  update,
  del
}
