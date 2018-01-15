const mongoose = require('mongoose')
const mongoosePaginate = require('mongoose-paginate') // 分页
const ids = require('./ID')

const groupSchema = mongoose.Schema({
  gid: {
    type: Number,
    index: {
      unique: true
    },
    default: -1 // 表示新题目
  },
  title: {
    type: String,
    required: true
  },
  list: {
    type: [String],
    default: []
  },
  create: {
    type: Number,
    default: Date.now
  }
}, {
  collection: 'Group'
})

groupSchema.plugin(mongoosePaginate)

groupSchema.pre('save', function (next) {
  // 保存
  if (this.gid === -1) {
    // 表示新的题目被创建了，因此赋予一个新的 id
    ids
      .generateId('Group')
      .then(id => {
        this.gid = id
      })
      .then(next)
  } else {
    next()
  }
})

module.exports = mongoose.model('Group', groupSchema)
