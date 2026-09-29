import { tagColors } from '@putong-oj/shared'
import mongoose from '../client.js'

const tagSchema = new mongoose.Schema({
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

const Tag = mongoose.model('Tag', tagSchema)

export default Tag
