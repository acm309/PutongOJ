import type { Document, PaginateModel, Types } from 'mongoose'
import type { NewsEntity } from '../types/entity'
import mongoosePaginate from 'mongoose-paginate-v2'
import config from '../config'
import mongoose from '../config/db'
import ids from './ID'

export interface NewsDocument extends Document<Types.ObjectId>, NewsEntity {}

type NewsModel = PaginateModel<NewsDocument>

const newsSchema = new mongoose.Schema({
  nid: {
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
      validator (v: any) {
        return v.length >= 3 && v.length <= 300
      },
      message: 'Title must be between 3 and 300 characters long',
    },
  },
  content: {
    type: String,
    required: true,
    validate: {
      validator (v: any) {
        return v.length >= 3
      },
      message: 'Content must be at least 3 characters long',
    },
  },
  status: {
    type: Number,
    default: config.status.Available, // 默认新建的消息显示
  },
  create: {
    type: Number,
    default: Date.now,
  },
}, {
  collection: 'News',
  timestamps: true,
})

newsSchema.plugin(mongoosePaginate)

newsSchema.pre('save', async function (this: NewsDocument, next) {
  if (this.nid === -1) {
    this.nid = await ids.generateId('News')
  }
  next()
})

const News
  = mongoose.model<NewsDocument, NewsModel>(
    'News', newsSchema,
  )

export default News
