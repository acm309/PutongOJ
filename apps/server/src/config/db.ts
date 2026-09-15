import process from 'node:process'
import mongoose from 'mongoose'
import mongoosePaginate from 'mongoose-paginate-v2'
import logger from '../utils/logger.ts'
import config from './index.ts'

mongoose.set('strictQuery', true)
mongoose.set('debug', config.mongooseDebug)
mongoose.Promise = globalThis.Promise

mongoose.connect(config.mongodbURL, { authSource: 'admin' })

mongoose.connection.on('connected', () => {
  logger.info('MongoDB connected successfully')
})
mongoose.connection.on('error', (err: Error) => {
  logger.error('MongoDB connected failed')
  logger.error(err)
  process.exit(-1)
})
mongoose.connection.on('disconnected', () => {
  logger.error('MongoDB disconnected')
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

export default mongoose
