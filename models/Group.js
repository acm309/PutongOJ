const mongoose = require('mongoose')
const mongoosePaginate = require('mongoose-paginate') // 分页
const ids = require('./ID')

const groupSchema = mongoose.Schema({
  gid: {
    type: Number,
    index: {
      unique: true
    },
    default: -1 // 表示新组
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

groupSchema.pre('validate', function (next) {
  if (this.title == null || this.title.length <= 3) {
    next(new Error('The length of the title should be greater than 3'))
  } if (this.title.length >= 80) {
    next(new Error('The length of the title should not be greater than 80'))
  } else if (this.list.length === 0) {
    next(new Error('The list should not be empty'))
  } else {
    next()
  }
})

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
