const mongoose = require('mongoose')
const logger = require('../utils/logger')
const config = require('./')

mongoose.Promise = global.Promise

// 连接MongoDB数据库
mongoose.connect(config.dbURL, {
  useMongoClient: true
})

mongoose.Promise = global.Promise

mongoose.connection.on('connected', () => {
  logger.info('MongoDB connected success.')
})

mongoose.connection.on('error', () => {
  logger.error('MongoDB connected fail.')
  process.exit(-1)
})

mongoose.connection.on('disconnected', () => {
  logger.error('MongoDB connected disconnected.')
})
