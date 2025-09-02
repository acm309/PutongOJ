import type { Document, PaginateModel } from 'mongoose'
import type { TagEntity } from '../types/entity'
import mongoose from 'mongoose'
import mongoosePaginate from 'mongoose-paginate-v2'
import { tagColors } from '../utils/constants'
import ID from './ID'

export interface TagDocument extends Document, TagEntity { }

type TagModel = PaginateModel<TagDocument>

const tagSchema = new mongoose.Schema({
  tagId: {
    type: Number,
    index: {
      unique: true,
    },
    default: -1,
  },
  name: {
    type: String,
    required: true,
    validate: {
      validator (v: any) {
        return v.length > 0 && v.length < 20
      },
    },
  },
  color: {
    type: String,
    required: true,
    enum: tagColors,
    default: 'default',
  },
  /** @deprecated */
  tid: {
    type: String,
    required: true,
    validate: {
      validator (v: any) {
        return v.length > 1 && v.length < 80
      },
      message: 'The length of the tid should be greater than 1 and less than 80',
    },
    index: {
      unique: true,
    },
  },
  /** @deprecated */
  list: {
    type: [ Number ],
    default: [],
  },
  /** @deprecated */
  create: {
    type: Number,
    default: Date.now,
  },
}, {
  collection: 'Tag',
  timestamps: true,
})

tagSchema.plugin(mongoosePaginate)

tagSchema.pre('save', async function (this: TagDocument, next) {
  if (this.tagId === -1) {
    this.tagId = await ID.generateId('Tag')
  }
  next()
})

const Tag
  = mongoose.model<TagDocument, TagModel>(
    'Tag', tagSchema,
  )

export default module.exports = Tag
