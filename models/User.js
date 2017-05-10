const mongoose = require('mongoose')
const mongoosePaginate = require('mongoose-paginate')
const { isUndefined } = require('../utils')
const Isemail = require('isemail')

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
  timerecord: {
    type: [Number],
    default: [0, 0, 0, 0, 0]
  },
  iprecord: {
    type: [String],
    default: ['', '', '', '', '']
  },
  status: {
    type: Number,
    default: 2 // TODO: fix this number to a constant variable
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

UserSchema.methods.updateRecords = function updateRecords (ip, time) {
  this.iprecord.pop()
  this.iprecord.unshift(ip)

  this.timerecord.pop()
  this.timerecord.unshift(time)
}

/**
  校验字段是否符合要求；
  参数里的所有字段都是可选的，只有提供了才会检查
*/
UserSchema.statics.validate = function validate ({
    uid,
    pwd,
    nick,
    privilege,
    mail,
    school,
    motto
}) {
  let error = ''
  let valid = true

  if (!isUndefined(uid)) {
    if (uid.length < 5 || uid.length > 20) {
      error = 'The length of uid should be between 6 and 20'
    } else if (/[^\d\w]/i.test(uid)) {
      error = 'Uid should only be comprised of letters and numbers'
    }
  }

  if (!isUndefined(nick)) {
    if (nick.length < 3 || nick.length > 40) {
      error = 'The length of nick should be between 6 and 40'
    }
  }

  if (!isUndefined(pwd)) {
    if (pwd.length < 5 || pwd.length > 25) {
      error = 'The length of pwd should be between 6 and 25'
    }
  }

  if (!isUndefined(mail)) {
    if (!Isemail.validate(mail)) {
      error = `"${mail}" is not a standard email address`
    }
  }

  if (!isUndefined(school)) {
    if (school > 50) {
      error = `The name of school should be longer than 50 letters`
    }
  }

  if (!isUndefined(motto)) {
    if (motto.length > 50) {
      error = `The length of motto should be larger than 50`
    }
  }

  if (error) valid = false

  return {
    valid,
    error
  }
}

module.exports = mongoose.model('User', UserSchema)
