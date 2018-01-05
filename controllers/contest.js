const only = require('only')
const Contest = require('../models/Contest')
const Problem = require('../models/Problem')
const Solution = require('../models/Solution')
const User = require('../models/User')
const logger = require('../utils/logger')

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

  ctx.body = {
    res
  }
}

// 返回一个竞赛
const findOne = async (ctx) => {
  const opt = parseInt(ctx.query.cid)
  const doc = await Contest.findOne({ cid: opt }).exec()

  const list = doc.list
  const total = list.length
  let res = []
  const process = list.map((pid, index) => {
    return Problem.findOne({pid}).exec()
      .then((problem) => {
        res[index] = only(problem, 'title pid')
      })
      .then(() => {
        return Solution.count({pid, mid: opt}).exec()
      })
      .then((count) => {
        res[index].submit = count
      })
      .then(() => {
        return Solution.count({pid, mid: opt, judge: 3}).exec()
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
const ranklist = async (ctx) => {
  let res = []
  let prime = []
  const cid = parseInt(ctx.query.cid)
  const users = await Solution.find({mid: cid}).distinct('uid').exec()
  const contest = await Contest.findOne({cid}).exec()
  const start = contest.start

  contest.list.forEach((value, index) => {
    prime[index] = ''
  })

  users.forEach((value, index) => {
    let prolist = []
    res[index] = { uid: value }
    contest.list.forEach((item, ind) => {
      prolist[ind] = {
        pid: item,
        submit: 0,
        solve: false,
        create: 0
      }
    })
    res[index].list = prolist
  })

  const process = users.map((value, index) => {
    return Solution.aggregate([
      { $match: {
        mid: cid,
        uid: value,
        judge: 3
      }},
      { $group: {
        _id: '$pid',
        pid: { $first: '$pid' },
        create: { $first: '$create' }
      }}
    ]).exec()
      .then((solution) => {
        let solve = []
        solution.forEach((value, index) => {
          solve[index] = only(value, 'pid create')
        })
        res[index].solve = solve
      })
      .then(() => {
        return Solution.find({mid: cid, uid: value, judge: {$ne: 3}}).exec()
      })
      .then((solution) => {
        let error = []
        solution.forEach((value, index) => {
          error[index] = only(value, 'pid create')
        })
        res[index].error = error
      })
      .then(() => {
        return User.findOne({uid: value}).exec()
      })
      .then((item) => {
        res[index].nick = item.nick
      })
  })
  await Promise.all(process)

  res.forEach((value, index) => {
    value.ac = value.solve.length
    value.time = 0
    value.error.forEach((item, ind) => {
      value.list[contest.list.indexOf(item.pid)].submit++
    })
    value.solve.forEach((item, ind) => {
      value.list[contest.list.indexOf(item.pid)].create = item.create - start
      value.list[contest.list.indexOf(item.pid)].solve = true
    })
    value.list.forEach((item, ind) => {
      if (item.solve) {
        // 直接相加导致字符串连接（不知道为啥）
        value.time += parseInt(item.submit * 20 * 60 * 1000) + parseInt(item.create)
      }
    })
  })

  res.sort(function (a, b) {
    if (a.ac !== b.ac) {
      return a.ac < b.ac ? 1 : -1 // 如果仅仅return a.ac < b.ac 排序会错误，原因暂时不知道
    } else {
      return a.time > b.time ? 1 : -1
    }
  })

  const rate = await Solution.aggregate([
    { $match: {
      mid: cid,
      judge: 3
    }},
    { $group: {
      _id: '$pid',
      pid: { $first: '$pid' },
      uid: { $first: '$uid' }
    }}
  ])

  rate.forEach((value, index) => {
    prime[contest.list.indexOf(value.pid)] = value.uid
  })

  ctx.body = {
    res,
    prime
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
  const fileds = ['title', 'encrypt', 'list', 'argument', 'start', 'end']
  opt.start = new Date(opt.start).getTime()
  opt.end = new Date(opt.end).getTime()
  fileds.forEach((filed) => {
    contest[filed] = opt[filed]
  })
  console.log(contest)
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
  console.log(ctx.params)
  const cid = ctx.params.cid
  console.log(cid)

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
