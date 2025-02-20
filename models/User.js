const mongoose = require('mongoose')
const mongoosePaginate = require('mongoose-paginate-v2')
const config = require('../config')

const userSchema = mongoose.Schema({
  uid: {
    type: String,
    required: true,
    validate: {
      validator (v) {
        return /^[a-z0-9]{3,20}$/i.test(v)
      },
      message:
        'Invalid uid. It should be 3-20 characters long '
        + 'and only contains letters and numbers',
    },
    index: {
      unique: true,
    },
  },
  pwd: {
    type: String,
    required: true,
  },
  privilege: {
    type: Number,
    default: config.privilege.PrimaryUser,
    validate: {
      validator (v) {
        return Object.values(config.privilege).includes(v)
      },
      message:
        `Invalid privilege. Valid values are `
        + `[${Object.values(config.privilege).join(', ')}]`,
    },
  },
  nick: {
    type: String,
    default: '',
    validate: {
      validator (v) {
        return v.length <= 20
      },
      message:
        'Nick is too long. It should be less than 20 characters long',
    },
  },
  motto: {
    type: String,
    default: '',
    validate: {
      validator (v) {
        return v.length <= 100
      },
      message:
        'Motto is too long. It should be less than 100 characters long',
    },
  },
  mail: {
    type: String,
    default: '',
    validate: {
      validator (v) {
        return v.length === 0
          || (v.length <= 254 && /^[\w.%+-]{1,64}@[a-z0-9.-]{1,255}\.[a-z]{2,}$/i.test(v))
      },
      message: 'Invalid email address',
    },
  },
  school: {
    type: String,
    default: '',
    validate: {
      validator (v) {
        return v.length <= 20
      },
      message:
        'School name is too long. It should be less than 20 characters long',
    },
  },
  create: {
    type: Number,
    default: Date.now,
  },
  gid: {
    type: [ Number ],
    default: [],
    index: true,
  },
  submit: {
    type: Number,
    default: 0,
  },
  solve: {
    type: Number,
    default: 0,
  },
  // DEPRECATED
  timerecord: {
    type: [ Number ],
    default: [ 0, 0, 0, 0, 0 ],
  },
  // DEPRECATED
  iprecord: {
    type: [ String ],
    default: [ '', '', '', '', '' ],
  },
  // DEPRECATED
  status: {
    type: Number,
    default: config.status.Available,
  },
}, {
  collection: 'User',
})

userSchema.plugin(mongoosePaginate)

module.exports = mongoose.model('User', userSchema)
