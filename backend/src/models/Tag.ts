import type { Document, PaginateModel } from 'mongoose'
import type { TagEntity } from '../types/entity'
import mongoose from 'mongoose'
import mongoosePaginate from 'mongoose-paginate-v2' // 分页

export interface TagDocument extends Document, TagEntity {}

type TagModel = PaginateModel<TagDocument>

const tagSchema = new mongoose.Schema({
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
  list: {
    type: [ Number ],
    default: [],
  },
  create: {
    type: Number,
    default: Date.now,
  },
}, {
  collection: 'Tag',
  timestamps: true,
})

tagSchema.plugin(mongoosePaginate)

const Tag
  = mongoose.model<TagDocument, TagModel>(
    'Tag', tagSchema,
  )

export default module.exports = Tag
