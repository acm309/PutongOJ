const mongoose = require('mongoose')
const ids = require('./ID')

const discussSchema = mongoose.Schema({
  did: {
    type: Number,
    index: {
      unique: true,
    },
    default: -1,
  },
  title: {
    type: String,
    required: true,
  },
  uid: {
    type: String,
    required: true,
    immutable: true,
  },
  comments: [ {
    uid: {
      type: String,
      required: true,
      immutable: true,
    },
    content: {
      type: String,
      default: '',
    },
    create: {
      type: Number,
      default: Date.now,
      immutable: true,
    },
  } ],
  create: {
    type: Number,
    default: Date.now,
    immutable: true,
  },
  update: {
    type: Number,
    default: Date.now,
  },
}, {
  collection: 'Discuss',
})

discussSchema.pre('validate', function (next) {
  if (this.title == null || this.title === '') {
    next(new Error('The title should not be empty'))
  } else if (this.title.length >= 80) {
    next(new Error('The length of the title should not be greater than 80'))
  } else if (
    this.comments == null || this.comments.length === 0
    || this.comments.some(item => !item.content)
  ) {
    next(new Error('comment not be empty'))
  } else {
    next()
  }
})

discussSchema.pre('save', function (next) {
  // 保存
  if (this.did === -1) {
    // 表示新的题目被创建了，因此赋予一个新的 id
    ids
      .generateId('Discuss')
      .then((id) => {
        this.did = id
      })
      .then(next)
  } else {
    next()
  }
})

module.exports = mongoose.model('Discuss', discussSchema)
