const mongoose = require('mongoose')
const mongoosePaginate = require('mongoose-paginate')
const { redisLPUSH, isUndefined, isAccepted } = require('../utils')
const config = require('../config')

const SolutionSchema = mongoose.Schema({
  sid: {
    type: Number,
    index: {
      unique: true // 建立索引，加快查询速度
    }
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
    type: String,
    default: Date.now
  },
  length: Number,
  judge: {
    type: Number,
    default: config.judge.Pending
  },
  status: {
    type: Number,
    default: 2 // TODO: fix this number to a constant variable
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
  }
}, {
  collection: 'Solution'
})

SolutionSchema.plugin(mongoosePaginate)

SolutionSchema.methods.pending = async function () {
  await redisLPUSH('solutions', this.sid)
}

SolutionSchema.methods.isAccepted = function () {
  return isAccepted(this.code)
}

SolutionSchema.statics.validate = function validate ({
  code
}) {
  let valid = true
  let error = ''
  if (!isUndefined(code)) {
    if (code.length < 20 || code.length > 10000) {
      error = 'The length of code should be between 20 and 10000'
    }
  }
  if (error) {
    valid = false
  }
  return { valid, error }
}

module.exports = mongoose.model('Solution', SolutionSchema)
