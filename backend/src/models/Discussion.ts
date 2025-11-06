import type { DiscussionModel } from '@putongoj/shared'
import type { Document, Model, Types } from 'mongoose'
import { COMMENT_LENGTH_MAX, DiscussionType, TITLE_LENGTH_MAX } from '@putongoj/shared'
import mongoose from '../config/db'
import ID from './ID'

interface DiscussionDocument extends Document<Types.ObjectId>, DiscussionModel { }

const discussionCommentSchema = new mongoose.Schema({
  user: {
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
}, {
  timestamps: true,
  _id: false,
})

const discussionSchema = new mongoose.Schema({
  discussionId: {
    type: Number,
    index: {
      unique: true,
    },
    default: -1,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  problem: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Problem',
    default: null,
  },
  contest: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Contest',
    default: null,
  },
  type: {
    type: Number,
    enum: Object.values(DiscussionType),
    default: DiscussionType.PrivateClarification,
  },
  title: {
    type: String,
    required: true,
    validate: {
      validator: (v: string) => v.length <= TITLE_LENGTH_MAX,
    },
  },
  comments: {
    type: [ discussionCommentSchema ],
    required: true,
  },
}, {
  collection: 'Discussion',
  timestamps: true,
})

discussionSchema.pre('save', async function (next) {
  if (this.discussionId === -1) {
    this.discussionId = await ID.generateId('Discussion')
  }
  next()
})

const Discussion
  = mongoose.model<DiscussionDocument, Model<DiscussionDocument>>(
    'Discussion', discussionSchema,
  )

export default Discussion
