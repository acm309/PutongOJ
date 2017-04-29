const mongoose = require('mongoose')
const mongoosePaginate = require('mongoose-paginate')

const ContestSchema = mongoose.Schema({
  cid: {
    type: Number,
    index: {
      unique: true // 建立索引，加快查询速度
    }
  },
  title: String,
  create: {
    type: String,
    default: Date.now
  },
  start: Number,
  end: Number,
  creator: String,
  list: [Number],
  status: {
    type: Number
  },
  encrypt: {
    type: Number
  },
  argument: {
    type: String
  }
}, {
  collection: 'Contest'
})

ContestSchema.plugin(mongoosePaginate)

module.exports = mongoose.model('Contest', ContestSchema)
