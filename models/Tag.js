const mongoose = require('mongoose')
const mongoosePaginate = require('mongoose-paginate') // 分页
const ids = require('./ID')

const tagSchema = mongoose.Schema({
  tid: {
    type: Number,
    index: {
      unique: true
    },
    default: -1 // 表示新标签
  },
  title: {
    type: String,
    required: true
  },
  list: {
    type: [Number],
    default: []
  }
}, {
  collection: 'Tag'
})

tagSchema.plugin(mongoosePaginate)

tagSchema.pre('save', function (next) {
  // 保存
  if (this.tid === -1) {
    // 表示新的题目被创建了，因此赋予一个新的 id
    ids
      .generateId('Tag')
      .then(id => {
        this.tid = id
      })
      .then(next)
  } else {
    next()
  }
})

module.exports = mongoose.model('Tag', tagSchema)
