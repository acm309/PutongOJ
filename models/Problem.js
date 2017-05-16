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
    default: 1000
  },
  memory: {
    type: Number,
    default: 32768
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

ProblemSchema.statics.validate = function validate ({ title }) {
  let error = ''
  let valid = true
  if (!isUndefined(title)) {
    if (title.length === 0) {
      error = 'Title should not be empty'
    } else if (title.length > 50) {
      error = 'The length of title should not be more than 50'
    }
  }
  if (error) {
    valid = false
  }
  return { valid, error }
}

module.exports = mongoose.model('Problem', ProblemSchema)
