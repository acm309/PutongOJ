const mongoose = require('mongoose')
const mongoosePaginate = require('mongoose-paginate')
const { isUndefined } = require('../utils')
const fse = require('fs-extra')
const path = require('path')

const ProblemSchema = mongoose.Schema({
  pid: {
    type: Number,
    index: {
      unique: true // 建立索引，加快查询速度
    }
  },
  title: {
    type: String,
    required: true
  },
  time: {
    type: Number,
    default: 1000,
    min: 100,
    max: 10000
  },
  memory: {
    type: Number,
    default: 32768,
    min: 100,
    max: 32768 * 4
  },
  create: {
    type: String,
    default: Date.now
  },
  description: {
    type: String,
    default: ''
  },
  input: {
    type: String,
    default: ''
  },
  output: {
    type: String,
    default: ''
  },
  in: {
    type: String,
    default: ''
  },
  out: {
    type: String,
    default: ''
  },
  solve: {
    type: Number,
    default: 0
  },
  submit: {
    type: Number,
    default: 0
  },
  status: {
    type: Number,
    default: 2 // TODO: fix this to a constant variable
  },
  hint: {
    type: String,
    default: ''
  }
}, {
  collection: 'Problem'
})

ProblemSchema.plugin(mongoosePaginate)

ProblemSchema.methods.saveSample = async function saveSample (root) {
  await Promise.all([
    fse.outputFile(path.resolve(root, `./${this.pid}/sample.in`), this.in),
    fse.outputFile(path.resolve(root, `./${this.pid}/sample.out`), this.out)
  ])
}

ProblemSchema.statics.validate = function validate ({ title, time, memory }) {
  let error = ''
  let valid = true
  if (!isUndefined(title)) {
    if (title.length === 0) {
      error = 'Title should not be empty'
    } else if (title.length > 50) {
      error = 'The length of title should not be more than 50'
    }
  }
  // wtf! +null is 0, and +NaN is also 0
  if (!isUndefined(time)) {
    if (isNaN(time) || time === null || typeof +time !== 'number') {
      error = 'Time should not a number'
    } else if (time < 100 || time > 10000) {
      error = 'time should be larger than 100 and smaller than 10000'
    }
  } else if (!isUndefined(memory)) {
    if (isNaN(memory) || memory === null || typeof +memory !== 'number') {
      error = 'Memory should not a number'
    } else if (memory < 100 || memory > 32768 * 4) {
      error = `memory should be larger than 100 and smaller than ${32768 * 4}`
    }
  }
  if (error) {
    valid = false
  }
  return { valid, error }
}

module.exports = mongoose.model('Problem', ProblemSchema)
