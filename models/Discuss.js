const mongoose = require('mongoose')
// const mongoosePaginate = require('mongoose-paginate')
// const { isUndefined } = require('../utils')

const DiscussSchema = mongoose.Schema({
  did: {
    type: Number,
    index: {
      unique: true
    }
  },
  title: String,
  create: {
    type: Number,
    default: Date.now
  },
  uid: {
    type: String,
    required: true
  },
  update: {
    type: Number,
    default: Date.now
  }
}, {
  collection: 'Discuss'
})

module.exports = mongoose.model('Discuss', DiscussSchema)
