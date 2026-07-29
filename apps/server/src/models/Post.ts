import { randomUUID } from 'node:crypto'
import { TITLE_LENGTH_MAX } from '@putongoj/shared'
import mongoose from '../config/db'

const postSchema = new mongoose.Schema({
  slug: {
    type: String,
    required: true,
    unique: true,
    index: true,
    default: () => randomUUID(),
    maxlength: 100,
  },
  title: {
    type: String,
    required: true,
    validate: {
      validator: (v: string) => v.length >= 1 && v.length <= TITLE_LENGTH_MAX,
      message: `Title must be between 1 and ${TITLE_LENGTH_MAX} characters long`,
    },
  },
  content: {
    type: String,
    default: '',
    validate: {
      validator: (v: string) => typeof v === 'string',
      message: 'Content must be a string',
    },
  },
  publishesAt: {
    type: Date,
    required: true,
  },
  isPublished: {
    type: Boolean,
    default: false,
  },
  isPinned: {
    type: Boolean,
    default: false,
  },
  isHidden: {
    type: Boolean,
    default: false,
  },
}, {
  collection: 'Posts',
  timestamps: true,
})

const Post = mongoose.model('Post', postSchema)

export default Post
