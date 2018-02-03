const mongoose = require('mongoose')
const mongoosePaginate = require('mongoose-paginate') // 分页

const tagSchema = mongoose.Schema({
  tid: {
    type: String,
    index: {
      unique: true
    }
  },
  list: {
    type: [Number],
    default: []
  }
}, {
  collection: 'Tag'
})

tagSchema.plugin(mongoosePaginate)

module.exports = mongoose.model('Tag', tagSchema)
