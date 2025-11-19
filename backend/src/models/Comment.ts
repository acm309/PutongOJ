import type { CommentModel } from '@putongoj/shared'
import type { Document, Model, Types } from 'mongoose'
import { COMMENT_LENGTH_MAX } from '@putongoj/shared'
import mongoose from '../config/db'
import ID from './ID'

interface CommentDocument extends Document<Types.ObjectId>, CommentModel { }

const commentSchema = new mongoose.Schema({
  commentId: {
    type: Number,
    index: {
      unique: true,
    },
    default: -1,
  },
  discussion: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Discussion',
    required: true,
    index: true,
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  content: {
    type: String,
    required: true,
    validate: {
      validator: (v: string) => v.length <= COMMENT_LENGTH_MAX,
    },
  },
  hidden: {
    type: Boolean,
    default: false,
  },
}, {
  collection: 'Comment',
  timestamps: true,
})

commentSchema.pre('save', async function (next) {
  if (this.commentId === -1) {
    this.commentId = await ID.generateId('Comment')
  }
  next()
})

const Comment
  = mongoose.model<CommentDocument, Model<CommentDocument>>(
    'Comment', commentSchema,
  )

export default Comment
