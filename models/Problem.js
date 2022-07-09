const mongoose = require('mongoose')
const mongoosePaginate = require('mongoose-paginate-v2') // 分页
const config = require('../config')
const ids = require('./ID')

const problemSchema = mongoose.Schema({
  isdone: Boolean,
  pid: {
    type: Number,
    index: {
      unique: true,
    },
    default: -1, // 表示新题目
  },
  time: {
    type: Number,
    default: 1000,
    min: 100,
    max: 10000,
  },
  memory: {
    type: Number,
    default: 32768,
    min: 100,
    max: 32768 * 4,
  },
  title: {
    type: String,
    required: true,
  },
  create: {
    type: Number,
    default: Date.now,
  },
  description: {
    type: String,
    default: '',
  },
  input: {
    type: String,
    default: '',
  },
  output: {
    type: String,
    default: '',
  },
  in: {
    type: String,
    default: '',
  },
  out: {
    type: String,
    default: '',
  },
  hint: {
    type: String,
    default: '',
  },
  solve: {
    type: Number,
    default: 0,
  },
  submit: {
    type: Number,
    default: 0,
  },
  status: {
    type: Number,
    default: config.status.Available, // 默认新建的题目显示
  },
  tags: {
    type: [ String ],
    default: [],
    index: true,
  },
}, {
  collection: 'Problem',
})

problemSchema.plugin(mongoosePaginate)

problemSchema.pre('validate', function (next) {
  // 验证字段
  if (this.time > 10000) {
    next(new Error('Time should not be longer than 10000 ms'))
  } else if (this.memory > 32768 * 5) {
    next(new Error(`Memory should not be greater than ${32768 * 5} kb`))
  } else {
    next()
  }
})

problemSchema.pre('save', function (next) {
  // 保存
  if (this.pid === -1) {
    // 表示新的题目被创建了，因此赋予一个新的 id
    ids
      .generateId('Problem')
      .then((id) => {
        this.pid = id
      })
      .then(next)
  } else {
    next()
  }
})

module.exports = mongoose.model('Problem', problemSchema)
