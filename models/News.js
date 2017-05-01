const mongoose = require('mongoose')
const mongoosePaginate = require('mongoose-paginate')
const { isUndefined } = require('../utils')

const NewsSchema = mongoose.Schema({
  nid: {
    type: Number,
    index: {
      unique: true
    }
  },
  title: String,
  content: String,
  status: {
    type: Number,
    default: 2 // TODO: fix this number to a constant variable
  },
  create: {
    type: Number,
    default: Date.now
  }
}, {
  collection: 'News'
})

NewsSchema.plugin(mongoosePaginate)

NewsSchema.statics.validate = function ({ title }) {
  let valid = true
  let error = ''
  if (!isUndefined(title)) {
    if (title.length > 50) {
      error = 'The length of title should be less than 50'
    } else if (title.length === 0) {
      error = 'The title can not be empty'
    }
  }

  if (error) {
    valid = false
  }
  return { valid, error }
}

module.exports = mongoose.model('News', NewsSchema)
