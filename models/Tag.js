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

tagSchema.pre('validate', function (next) {
  if (this.list.length === 0) {
    next(new Error('The list should not be empty'))
  } else {
    next()
  }
})

module.exports = mongoose.model('Tag', tagSchema)
