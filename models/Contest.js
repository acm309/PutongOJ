const mongoose = require('mongoose')
const mongoosePaginate = require('mongoose-paginate')
const { isUndefined, redisGet, redisSet } = require('../utils')
const arrayDuplicated = require('array-duplicated')
const Problem = require('./Problem')
const Solution = require('./Solution')

const ContestSchema = mongoose.Schema({
  cid: {
    type: Number,
    index: {
      unique: true // 建立索引，加快查询速度
    }
  },
  title: String,
  create: {
    type: String,
    default: Date.now
  },
  start: Number,
  end: Number,
  creator: String,
  list: [Number],
  status: {
    type: Number
  },
  encrypt: {
    type: Number
  },
  argument: {
    type: String
  }
}, {
  collection: 'Contest'
})

ContestSchema.plugin(mongoosePaginate)

ContestSchema.statics.validate = function ({
  title,
  list,
  start,
  end
}) {
  let error = ''
  let valid = true
  if (!isUndefined(title)) {
    if (title.length > 50) {
      error = 'The length of title should not be more than 50'
    }
  }
  if (!isUndefined(list) && Array.isArray(list)) {
    if (list.length > 50) {
      error = 'The length of list should not be more than 50'
    }
    // 是否有重复元素
    const dulp = arrayDuplicated(list)
    if (dulp.length > 0) {
      error = `${dulp.join(', ')} are dulplicated`
    }
  }
  if (!isUndefined(start) && !isUndefined(end)) {
    if (+start > +end) {
      error = 'Start time should not be later than end time'
    }
  }
  if (error) {
    valid = false
  }
  return { valid, error }
}

// 以下两个函数用于清空记录，一般是比赛更新时调用，便于重新生成记录
ContestSchema.methods.clearOverview = function () {
  return redisSet(`contests:${this.cid}:overview`, JSON.stringify({}))
}

ContestSchema.methods.clearRanklist = function () {
  return redisSet(`contests:${this.cid}:ranklist`, JSON.stringify({}))
}

// the solution means update
// solution 参数可选，如果有，代表更新 overview。
// 注意: 如果 res 为 null，则不用管 solution 参数，因为此时 res 的结果为所有的提交重新计算
// 这个结果已经包括了 solution 了参数

// get 与 set 分开，可能需要两者合并为一个原子操作保证安全
ContestSchema.methods.fetchOverview = async function (solution) {
  let res = await redisGet(`contests:${this.cid}:overview`)
  if (res === null) {
    res = {}
    const ps = this.list.map(async (pid, index) => {
      await Problem.findOne({pid}).exec()
        .then((problem) => {
          res[index] = { // 这道题的基本信息
            title: problem.title,
            pid: problem.pid
          }
        })
        .then(() => { // 这场比赛里这道题的提交数
          return Solution.count({ mid: this.cid, pid }).exec()
        })
        .then((cnt) => { res[index].submit = cnt })
        .then(() => { // 这场比赛里这道题的 AC 数
          return Solution.count({ mid: this.cid, pid, judge: 3 }).exec()
        })
        .then((cnt) => { res[index].solve = cnt })
    })
    await Promise.all(ps)
    await redisSet(`contests:${this.cid}:overview`, JSON.stringify(res))
    return res
  }
  res = JSON.parse(res)
  if (solution) { // 有新添加的 solution
    const index = this.list.indexOf(solution.pid)
    res[index].submit ++
    res[index].solve += (solution.judge === 3 ? 1 : 0)
    await redisSet(`contests:${this.cid}:overview`, JSON.stringify(res))
  }
  return res
}

ContestSchema.methods.fetchRanklist = async function () {
  const res = await redisGet(`contests:${this.cid}:ranklist`)
  if (res === null) {
    return ''
  }
  return res
}

module.exports = mongoose.model('Contest', ContestSchema)
