import type { Document, PaginateModel } from 'mongoose'
import type { DiscussEntity } from '../types/entity'
import mongoose from '../config/db'
import ID from './ID'

export interface DiscussDocument extends Document, DiscussEntity {}

type DiscussModel = PaginateModel<DiscussDocument>

const commentSchema = new mongoose.Schema({
  uid: {
    type: String,
    required: true,
    immutable: true,
  },
  content: {
    type: String,
    default: '',
    validate: {
      validator: (v: string) => v.length > 0,
      message: 'The content of the comment should not be empty',
    },
  },
  create: {
    type: Number,
    default: Date.now,
    immutable: true,
  },
}, {
  timestamps: true,
  _id: false,
})

const discussSchema = new mongoose.Schema({
  did: {
    type: Number,
    index: {
      unique: true,
    },
    default: -1,
  },
  title: {
    type: String,
    required: true,
    validate: {
      validator: (v: string) => v.length <= 80,
      message: 'The length of the title should not be greater than 80',
    },
  },
  uid: {
    type: String,
    required: true,
    immutable: true,
  },
  comments: {
    type: [ commentSchema ],
    required: true,
  },
  create: {
    type: Number,
    default: Date.now,
    immutable: true,
  },
  update: {
    type: Number,
    default: Date.now,
  },
}, {
  collection: 'Discuss',
  timestamps: true,
})

discussSchema.pre('save', async function (next) {
  if (this.did === -1) {
    this.did = await ID.generateId('Discuss')
  }
  next()
})

const Discuss
  = mongoose.model<DiscussDocument, DiscussModel>(
    'Discuss', discussSchema,
  )

export default module.exports = Discuss
