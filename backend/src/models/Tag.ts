import { tagColors } from '@putongoj/shared'
import mongoose from '../config/db'
import ID from './ID'

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
        return v.length > 0 && v.length < 30
      },
    },
    index: true,
  },
  color: {
    type: String,
    required: true,
    enum: tagColors,
    default: 'default',
  },
}, {
  collection: 'Tag',
  timestamps: true,
})

tagSchema.pre('save', async function (this) {
  if (this.tagId === -1) {
    this.tagId = await ID.generateId('Tag')
  }
})

const Tag = mongoose.model('Tag', tagSchema)

export default Tag
