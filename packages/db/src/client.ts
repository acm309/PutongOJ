import mongoose from 'mongoose'
import mongoosePaginate from 'mongoose-paginate-v2'

mongoose.set('strictQuery', true)
mongoose.Promise = globalThis.Promise

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

export type ConnectMongooseOptions = {
  uri: string
  authSource?: string
  debug?: boolean
  onConnected?: () => void
  onDisconnected?: () => void
  onError?: (error: Error) => void
}

export async function connectMongoose (options: ConnectMongooseOptions) {
  mongoose.set('debug', options.debug ?? false)

  if (options.onConnected) {
    mongoose.connection.on('connected', options.onConnected)
  }
  if (options.onDisconnected) {
    mongoose.connection.on('disconnected', options.onDisconnected)
  }
  if (options.onError) {
    mongoose.connection.on('error', options.onError)
  }

  if (mongoose.connection.readyState !== 0) {
    return mongoose
  }

  try {
    await mongoose.connect(options.uri, {
      authSource: options.authSource ?? 'admin',
    })
  } catch (error) {
    options.onError?.(error as Error)
    throw error
  }

  return mongoose
}

export async function disconnectMongoose () {
  await mongoose.disconnect()
}

export { mongoose }
export default mongoose
