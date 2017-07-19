const mongoose = require('mongoose')
// const mongoosePaginate = require('mongoose-paginate')
// const { isUndefined } = require('../utils')

const CommentSchema = mongoose.Schema({
  cmid: {
    type: Number,
    index: {
      unique: true
    }
  },
  did: Number,
  create: {
    type: Number,
    default: Date.now
  },
  uid: {
    type: String,
    required: true
  },
  content: String
}, {
  collection: 'Comment'
})

module.exports = mongoose.model('Comment', CommentSchema)
