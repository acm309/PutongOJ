const mongoose = require('mongoose')
const mongoosePaginate = require('mongoose-paginate')
const { isUndefined, redisGet } = require('../utils')
const arrayDuplicated = require('array-duplicated')

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
  }
  if (!isUndefined(list) && Array.isArray(list)) {
    if (list.length > 50) {
      error = 'The length of list should not be more than 50'
    }
    // 是否有重复元素
    const dulp = arrayDuplicated(list)
    if (dulp.length > 0) {
      error = `${dulp.join(', ')} are dulplicated`
    }
  }
  if (!isUndefined(start) && !isUndefined(end)) {
    if (+start > +end) {
      error = 'Start time should not be later than end time'
    }
  }
  if (error) {
    valid = false
  }
  return { valid, error }
}

ContestSchema.methods.fetchOverview = async function () {
  const res = await redisGet(`contests:${this.cid}:overview`)
  if (res === null) {
    return ''
  }
  return res
}

ContestSchema.methods.fetchRanklist = async function () {
  const res = await redisGet(`contests:${this.cid}:ranklist`)
  if (res === null) {
    return ''
  }
  return res
}

module.exports = mongoose.model('Contest', ContestSchema)
