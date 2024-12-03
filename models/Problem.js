const mongoose = require('mongoose')
const mongoosePaginate = require('mongoose-paginate-v2')

const config = require('../config')
const ids = require('./ID')

const problemSchema = mongoose.Schema({
  isdone: Boolean,
  pid: { // 唯一标识符，-1 表示新题目
    type: Number,
    index: {
      unique: true,
    },
    default: -1,
  },
  time: { // 时间限制，单位 ms
    type: Number,
    default: 1000,
    min: 100,
    max: config.limitation.time,
  },
  memory: { // 内存限制，单位 KB
    type: Number,
    default: 32768,
    min: 128,
    max: config.limitation.memory,
  },
  title: { // 标题
    type: String,
    required: true,
  },
  create: { // 创建时间
    type: Number,
    default: Date.now,
  },
  description: { // 描述
    type: String,
    default: '',
  },
  input: { // 输入格式
    type: String,
    default: '',
  },
  output: { // 输出格式
    type: String,
    default: '',
  },
  in: { // 输入样例
    type: String,
    default: '',
  },
  out: { // 输出样例
    type: String,
    default: '',
  },
  hint: { // 提示
    type: String,
    default: '',
  },
  spj: { // 是否是特判题目
    type: Boolean,
    default: false,
  },
  spjcode: { // 特判代码
    type: String,
    default: '',
  },
  solve: { // 解决人数
    type: Number,
    default: 0,
  },
  submit: { // 提交人数
    type: Number,
    default: 0,
  },
  status: { // 状态，默认新建的题目不显示
    type: Number,
    default: config.status.Reserve,
  },
  tags: { // 标签
    type: [String],
    default: [],
    index: true,
  },
}, {
  collection: 'Problem',
})

problemSchema.plugin(mongoosePaginate)

problemSchema.pre('validate', function (next) {
  // 验证字段
  if (this.time > config.limitation.time) {
    next(new Error(`Time should not be longer than ${config.limitation.time} ms`))
  } else if (this.memory > config.limitation.memory) {
    next(new Error(`Memory should not be greater than ${config.limitation.memory} KB`))
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
