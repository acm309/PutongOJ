import type { DiscussionModel } from '@putongoj/shared'
import type { Document, Model, Types } from 'mongoose'
import { DiscussionType, TITLE_LENGTH_MAX } from '@putongoj/shared'
import mongoose from '../config/db'
import ID from './ID'

interface DiscussionDocument extends Document<Types.ObjectId>, DiscussionModel { }

const discussionSchema = new mongoose.Schema({
  discussionId: {
    type: Number,
    index: {
      unique: true,
    },
    default: -1,
  },
  author: {
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
    enum: DiscussionType,
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
    type: Number,
    default: 0,
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
