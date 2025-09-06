import type { Document, PaginateModel } from 'mongoose'
import type { TagEntity, TagEntityItem, TagEntityPreview, TagEntityView } from '../types/entity'
import mongoose from 'mongoose'
import mongoosePaginate from 'mongoose-paginate-v2'
import { tagColors } from '../utils/constants'
import ID from './ID'

export type TagDocument = Document & TagEntity

type TagModel = PaginateModel<TagDocument> & {
  toItem: (tag: Partial<TagEntity>) => TagEntityItem
  toPreview: (tag: Partial<TagEntity>) => TagEntityPreview
  toView: (tag: Partial<TagEntity>) => TagEntityView
}

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

const toItem = (tag: Partial<TagEntity>): TagEntityItem => {
  return {
    tagId: tag.tagId ?? -1,
    name: tag.name ?? 'Unknown',
    color: tag.color ?? 'default',
  }
}
const toPreview = (tag: Partial<TagEntity>): TagEntityPreview => {
  return {
    ...toItem(tag),
    createdAt: new Date(tag?.createdAt ?? Date.now()).getTime(),
    updatedAt: new Date(tag?.updatedAt ?? Date.now()).getTime(),
  }
}
const toView = (tag: Partial<TagEntity>): TagEntityView => {
  return toPreview(tag)
}

tagSchema.statics.toItem = toItem
tagSchema.statics.toPreview = toPreview
tagSchema.statics.toView = toView

const Tag
  = mongoose.model<TagDocument, TagModel>(
    'Tag', tagSchema,
  )

export default module.exports = Tag
