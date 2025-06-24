const mongoose = require('mongoose')
const mongoosePaginate = require('mongoose-paginate-v2')
const config = require('../config')
const ID = require('./ID')

const ContestSchema = mongoose.Schema({
  cid: {
    type: Number,
    index: {
      unique: true,
    },
    default: -1,
  },
  title: {
    type: String,
    required: true,
    validate: {
      validator (v) {
        return v.length <= 80
      },
      message: 'Title is too long. It should be less than 80 characters long',
    },
  },
  start: {
    type: Number,
    required: true,
    validate: {
      validator (v) {
        return !Number.isNaN(new Date(v).getTime())
      },
      message: 'Start time must be a valid date',
    },
  },
  end: {
    type: Number,
    required: true,
    validate: {
      validator (v) {
        return !Number.isNaN(new Date(v).getTime())
      },
      message: 'End time must be a valid date',
    },
  },
  list: {
    type: [ Number ],
    default: [],
    validate: {
      validator (v) {
        return Array.isArray(v)
      },
    },
  },
  status: {
    type: Number,
    enum: Object.values(config.status),
    default: config.status.Available,
  },
  encrypt: {
    type: Number,
    enum: Object.values(config.encrypt),
    default: config.encrypt.Public,
  },
  argument: {
    type: String,
    default: '',
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    default: null,
    validate: {
      validator (v) {
        return v === null || mongoose.Types.ObjectId.isValid(v)
      },
      message: 'Invalid course ID',
    },
  },
  create: {
    type: Number,
    default: Date.now,
    immutable: true,
  },
}, {
  collection: 'Contest',
})

ContestSchema.plugin(mongoosePaginate)

ContestSchema.pre('validate', function (next) {
  if (this.start >= this.end) {
    next(new Error('The contest end time must be later than the start time!'))
  }
  next()
})

ContestSchema.pre('save', async function (next) {
  if (this.cid === -1) {
    this.cid = await ID.generateId('Contest')
  }
  next()
})

module.exports = mongoose.model('Contest', ContestSchema)
