const mongoose = require('mongoose')
const ids = require('./ID')

const discussSchema = mongoose.Schema({
  did: {
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
  create: {
    type: Number,
    default: Date.now
  },
  updated: {
    type: Number,
    required: true
  },
  uid: {
    type: String,
    required: true
  },
  comments: [{
    uid: {
      type: String,
      required: true
    },
    content: {
      type: String,
      default: ''
    },
    create: {
      type: Number,
      default: Date.now
    }
  }]
}, {
  collection: 'Discuss'
})

discussSchema.pre('save', function (next) {
  // 保存
  if (this.did === -1) {
    // 表示新的题目被创建了，因此赋予一个新的 id
    ids
      .generateId('Discuss')
      .then(id => {
        this.did = id
      })
      .then(next)
  } else {
    next()
  }
})

module.exports = mongoose.model('Discuss', discussSchema)
