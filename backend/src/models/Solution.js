const mongoose = require('mongoose')
const mongoosePaginate = require('mongoose-paginate-v2')
const config = require('../config')
const ids = require('./ID')

const solutionSchema = mongoose.Schema({
  sid: {
    type: Number,
    default: -1,
    immutable: true,
    index: {
      unique: true,
    },
  },
  pid: {
    type: Number,
    immutable: true,
    index: true,
    required: true,
  },
  uid: {
    type: String,
    immutable: true,
    index: true,
    required: true,
  },
  mid: { // mid 指代 contest id (历史遗留问题)
    type: Number,
    default: -1,
    immutable: true,
    index: true,
  },
  code: {
    type: String,
    immutable: true,
    required: true,
    validate: {
      validator (v) {
        return v.length >= 8 && v.length <= 16384
      },
      message:
        'The length of code should be greater than 8 and less than 16384',
    },
  },
  length: {
    type: Number,
    immutable: true,
    required: true,
  },
  language: {
    type: Number,
    immutable: true,
    index: true,
    required: true,
  },
  create: {
    type: Number,
    default: Date.now,
    immutable: true,
  },
  status: {
    type: Number,
    default: config.status.Available,
    validate: {
      validator (v) {
        return Object.values(config.status).includes(v)
      },
      message:
        `Invalid status. Valid values are `
        + `[${Object.values(config.status).join(', ')}]`,
    },
  },
  judge: {
    type: Number,
    default: config.judge.Pending,
    validate: {
      validator (v) {
        return Object.values(config.judge).includes(v)
      },
      message:
        `Invalid judge. Valid values are `
        + `[${Object.values(config.judge).join(', ')}]`,
    },
    index: true,
  },
  time: {
    type: Number,
    default: 0,
  },
  memory: {
    type: Number,
    default: 0,
  },
  error: {
    type: String,
    default: '',
  },
  sim: {
    type: Number,
    default: 0,
  },
  sim_s_id: {
    type: Number,
    default: 0,
  },
  testcases: {
    type: mongoose.Schema.Types.Mixed,
    default: [],
  },
}, {
  collection: 'Solution',
})

solutionSchema.plugin(mongoosePaginate)

solutionSchema.virtual('isAccepted').get(function () {
  return this.judge === config.judge.Accepted
})
solutionSchema.virtual('isPending').get(function () {
  return this.judge === config.judge.Pending
})

solutionSchema.pre('save', async function (next) {
  if (this.sid === -1) {
    this.sid = await ids.generateId('Solution')
  }
  next()
})

module.exports = mongoose.model('Solution', solutionSchema)
