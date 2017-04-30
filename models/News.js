const mongoose = require('mongoose')
const mongoosePaginate = require('mongoose-paginate')

const NewsSchema = mongoose.Schema({
  nid: {
    type: Number,
    index: {
      unique: true
    }
  },
  title: String,
  content: String,
  status: Number,
  create: {
    type: Number,
    default: Date.now
  }
}, {
  collection: 'News'
})

NewsSchema.plugin(mongoosePaginate)

module.exports = mongoose.model('News', NewsSchema)
