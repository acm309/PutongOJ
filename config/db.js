const mongoose = require('mongoose')
const logger = require('../utils/logger')
const config = require('./')

mongoose.Promise = global.Promise

// 连接MongoDB数据库
mongoose.connect(config.dbURL)

mongoose.Promise = global.Promise

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
