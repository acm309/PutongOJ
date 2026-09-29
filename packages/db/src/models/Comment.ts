import type { CommentModel } from '@putong-oj/shared'
import type { Document, Model, Types } from 'mongoose'
import { COMMENT_LENGTH_MAX } from '@putong-oj/shared'
import mongoose from '../client.js'

type CommentDocument = { } & Document<Types.ObjectId> & CommentModel

const commentSchema = new mongoose.Schema({
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

const Comment
  = mongoose.model<CommentDocument, Model<CommentDocument>>(
    'Comment',
    commentSchema,
  )

export default Comment
