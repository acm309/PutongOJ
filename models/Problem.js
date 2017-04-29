const mongoose = require('mongoose')
const mongoosePaginate = require('mongoose-paginate')

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
  argument: {
    type: String
  },
  hint: String
}, {
  collection: 'Problem'
})

ProblemSchema.plugin(mongoosePaginate)

module.exports = mongoose.model('Problem', ProblemSchema)
