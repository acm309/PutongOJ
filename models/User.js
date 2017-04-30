const mongoose = require('mongoose')
const mongoosePaginate = require('mongoose-paginate')

const UserSchema = mongoose.Schema({
  uid: {
    type: String,
    index: {
      unique: true // 建立索引，加快查询速度
    }
  },
  nick: {
    type: String,
    required: true
  },
  create: {
    type: String,
    default: Date.now
  },
  privilege: {
    type: Number,
    default: 1 // TODO: fix this number to a constant variable
  },
  pwd: {
    type: String,
    require: true
  },
  timerecord: [Number],
  iprecord: [String],
  status: {
    type: Number
  },
  solve: {
    type: Number,
    default: 0
  },
  submit: {
    type: Number,
    default: 0
  },
  motto: String,
  mail: String,
  school: String
}, {
  collection: 'User'
})

UserSchema.plugin(mongoosePaginate)

module.exports = mongoose.model('User', UserSchema)
