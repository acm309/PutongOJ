const process = require('node:process')
const mongoose = require('mongoose')
const mongoosePaginate = require('mongoose-paginate-v2')
const logger = require('../utils/logger')
const config = require('./')

mongoose.Promise = globalThis.Promise

// 连接MongoDB数据库
mongoose.connect(config.dbURL)

mongoose.Promise = globalThis.Promise

mongoose.connection.on('connected', () => {
  logger.info('MongoDB connected success.')
})

mongoose.connection.on('error', (err) => {
  logger.error('MongoDB connected fail.')
  logger.error(err)
  process.exit(-1)
})

mongoose.connection.on('disconnected', () => {
  logger.error('MongoDB connected disconnected.')
})

mongoose.plugin((schema) => {
  schema.options.toJSON = {
    transform (doc, ret) {
      delete ret._id
    },
  }
  schema.options.toObject = {
    transform (doc, ret) {
      delete ret._id
    },
  }
})

mongoosePaginate.paginate.options = {
  customLabels: {
    totalDocs: 'total',
    totalPages: 'pages',
    hasNextPage: false,
    hasPrevPage: false,
    pagingCounter: false,
    nextPage: false,
    prevPage: false,
  },
}
