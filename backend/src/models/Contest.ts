import type { Document, PaginateModel } from 'mongoose'
import type { ContestEntity } from '../types/entity'
import mongoosePaginate from 'mongoose-paginate-v2'
import mongoose from '../config/db'
import constants from '../utils/constants'
import ID from './ID'

export interface ContestDocument extends Document, ContestEntity {}

type ContestModel = PaginateModel<ContestDocument>

const contestOptionSchema = new mongoose.Schema({
  labelingStyle: {
    type: Number,
    enum: Object.values(constants.contestLabelingStyle),
    default: constants.contestLabelingStyle.numeric,
  },
}, {
  _id: false,
})

const contestSchema = new mongoose.Schema({
  cid: {
    type: Number,
    default: -1,
    immutable: true,
    index: {
      unique: true,
    },
  },
  title: {
    type: String,
    required: true,
    validate: {
      validator (v: any) {
        return v.length <= 80
      },
      message: 'Title is too long. It should be less than 80 characters long',
    },
  },
  start: {
    type: Number,
    required: true,
    validate: {
      validator (v: any) {
        return !Number.isNaN(new Date(v).getTime())
      },
      message: 'Start time must be a valid date',
    },
  },
  end: {
    type: Number,
    required: true,
    validate: {
      validator (v: any) {
        return !Number.isNaN(new Date(v).getTime())
      },
      message: 'End time must be a valid date',
    },
  },
  list: {
    type: [ Number ],
    default: [],
    validate: {
      validator (v: any) {
        return Array.isArray(v)
      },
    },
  },
  status: {
    type: Number,
    enum: Object.values(constants.status),
    default: constants.status.Available,
  },
  encrypt: {
    type: Number,
    enum: Object.values(constants.encrypt),
    default: constants.encrypt.Public,
  },
  argument: {
    type: String,
    default: '',
  },
  option: {
    type: contestOptionSchema,
    default: () => ({}),
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    default: null,
    validate: {
      validator (v: any) {
        return v === null || mongoose.Types.ObjectId.isValid(v)
      },
      message: 'Invalid course ID',
    },
  },
}, {
  collection: 'Contest',
  timestamps: true,
})

contestSchema.plugin(mongoosePaginate)

contestSchema.pre('validate', async function (this: ContestDocument, next) {
  if (this.start >= this.end) {
    next(new Error('The contest end time must be later than the start time!'))
  }
  next()
})
contestSchema.pre('save', async function (this: ContestDocument, next) {
  if (this.cid === -1) {
    this.cid = await ID.generateId('Contest')
  }
  next()
})

const Contest
  = mongoose.model<ContestDocument, ContestModel>(
    'Contest', contestSchema,
  )

export default module.exports = Contest
