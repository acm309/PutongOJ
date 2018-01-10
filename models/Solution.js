const mongoose = require('mongoose')
const mongoosePaginate = require('mongoose-paginate')
const config = require('../config')
const ids = require('./ID')

const solutionSchema = mongoose.Schema({
  sid: {
    type: Number,
    index: {
      unique: true
    },
    default: -1
  },
  pid: {
    type: Number,
    required: true
  },
  uid: {
    type: String,
    required: true
  },
  mid: {
    type: Number,
    default: 1 // 历史遗留问题，这里的 mid 指代 cid, 默认为 1
  },
  time: {
    type: Number,
    default: 0
  },
  memory: {
    type: Number,
    default: 0
  },
  create: {
    type: Number,
    default: Date.now
  },
  length: Number,
  judge: {
    type: Number,
    default: config.judge.Pending
  },
  status: {
    type: Number,
    default: 2
  },
  language: {
    type: Number,
    required: true
  },
  error: {
    type: String,
    default: ''
  },
  sim: {
    type: Number,
    default: 0
  },
  sim_s_id: {
    type: Number,
    default: 0
  },
  code: {
    type: String,
    required: true
  },
  module: {
    type: Number,
    default: config.module.Problem
  },
  testcases: {
    type: mongoose.Schema.Types.Mixed,
    default: []
  }
}, {
  collection: 'Solution'
})

solutionSchema.plugin(mongoosePaginate)

/**
 * @example
 * const s = await Solution.findOne({ sid }).exec()
 * if (s.isAccepted) console.log(`${s.sid} has been Accepted`)
 * else console.log(`Try again to solve it`)
 */
solutionSchema.virtual('isAccepted').get(function () {
  return this.judge === config.judge.Accepted
})

solutionSchema.virtual('isPending').get(function () {
  return this.judge === config.judge.Pending
})

solutionSchema.pre('validate', function (next) {
  // 验证字段
  if (isNaN(this.pid)) {
    next(new Error('Pid should be a number'))
  } else if (this.code.length <= 5) {
    next(new Error('The length of code should be greater than 5'))
  } else if (this.code.length >= 5000) {
    next(new Error('The length of code should be less than 5000'))
  } else {
    next()
  }
})

solutionSchema.pre('save', function (next) {
  // 保存
  if (this.sid === -1) {
    // 表示新的提交被创建了，因此赋予一个新的 id
    ids
      .generateId('Solution')
      .then(id => {
        this.sid = id
      })
      .then(next)
  } else {
    next()
  }
})

module.exports = mongoose.model('Solution', solutionSchema)
