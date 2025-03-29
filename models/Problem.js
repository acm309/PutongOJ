const mongoose = require('mongoose')
const mongoosePaginate = require('mongoose-paginate-v2')
const config = require('../config')
const ID = require('./ID')

const problemSchema = mongoose.Schema({
  pid: {
    type: Number,
    default: -1,
    immutable: true,
    index: {
      unique: true,
    },
  },
  title: {
    type: String,
    required: true,
    validate: {
      validator (v) {
        return v.length <= 80
      },
      message:
        'Title is too long. It should be less than 80 characters long',
    },
  },
  time: {
    type: Number,
    default: 1000,
    min: 100,
    max: config.limitation.time,
  },
  memory: {
    type: Number,
    default: 32768,
    min: 32768,
    max: config.limitation.memory,
  },
  description: {
    type: String,
    default: '',
  },
  input: {
    type: String,
    default: '',
  },
  output: {
    type: String,
    default: '',
  },
  in: {
    type: String,
    default: '',
  },
  out: {
    type: String,
    default: '',
  },
  hint: {
    type: String,
    default: '',
  },
  status: {
    type: Number,
    default: config.status.Reserve,
  },
  type: {
    type: Number,
    enum: Object.values(config.problemType),
    default: config.problemType.Traditional,
  },
  code: {
    type: String,
    default: '',
  },
  tags: {
    type: [ String ],
    default: [],
    index: true,
  },
  create: {
    type: Number,
    default: Date.now,
    immutable: true,
  },
  submit: {
    type: Number,
    default: 0,
  },
  solve: {
    type: Number,
    default: 0,
  },
}, {
  collection: 'Problem',
})

problemSchema.plugin(mongoosePaginate)

problemSchema.pre('save', async function (next) {
  if (this.pid === -1) {
    this.pid = await ID.generateId('Problem')
  }
  next()
})

module.exports = mongoose.model('Problem', problemSchema)
