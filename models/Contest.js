const mongoose = require('mongoose')
const mongoosePaginate = require('mongoose-paginate')
const { isUndefined } = require('../utils')

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

ContestSchema.statics.validate = function ({
  title,
  list,
  start,
  end
}) {
  let error = ''
  let valid = true
  if (!isUndefined(title)) {
    if (title.length > 50) {
      error = 'The length of title should not be more than 50'
    }
  } else if (!isUndefined(list) && Array.isArray(list)) {
    if (list.length > 50) {
      error = 'The length of list should not be more than 50'
    }
  } else if (!isUndefined(start) && !isUndefined(end)) {
    if (+start > +end) {
      error = 'Start time should not be later than end time'
    }
  }
  if (error) {
    valid = false
  }
  return { valid, error }
}

module.exports = mongoose.model('Contest', ContestSchema)
