const mongoose = require('mongoose')
const mongoosePaginate = require('mongoose-paginate-v2') // 分页

const tagSchema = mongoose.Schema({
  tid: {
    type: String,
    index: {
      unique: true,
    },
  },
  list: {
    type: [ Number ],
    default: [],
  },
  create: {
    type: Number,
    default: Date.now,
  },
}, {
  collection: 'Tag',
})

tagSchema.plugin(mongoosePaginate)

tagSchema.pre('validate', function (next) {
  if (this.tid == null || this.tid.length <= 1) {
    next(new Error('The length of the tid should be greater than 1'))
  }
  if (this.tid.length >= 80) {
    next(new Error('The length of the tid should not be greater than 80'))
  } else {
    next()
  }
})

module.exports = mongoose.model('Tag', tagSchema)
