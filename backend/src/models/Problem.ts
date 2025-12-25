import type { Document, PaginateModel, Types } from 'mongoose'
import type { ProblemEntity } from '../types/entity'
import type { TagDocument } from './Tag'
import mongoosePaginate from 'mongoose-paginate-v2'
import config from '../config'
import mongoose from '../config/db'
import ID from './ID'

export type ProblemDocument = Document<Types.ObjectId> & ProblemEntity
export type ProblemDocumentPopulated = Omit<ProblemDocument,
  'tags'
> & {
  tags: TagDocument[]
}

type CourseModel = PaginateModel<ProblemDocument>

const problemSchema = new mongoose.Schema({
  pid: {
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
      message:
        'Title is too long. It should be less than 80 characters long',
    },
  },
  time: {
    type: Number,
    default: 1000,
    min: 100,
    max: config.limitation.time,
  },
  memory: {
    type: Number,
    default: 32768,
    min: 32768,
    max: config.limitation.memory,
  },
  description: {
    type: String,
    default: '',
  },
  input: {
    type: String,
    default: '',
  },
  output: {
    type: String,
    default: '',
  },
  in: {
    type: String,
    default: '',
  },
  out: {
    type: String,
    default: '',
  },
  hint: {
    type: String,
    default: '',
  },
  status: {
    type: Number,
    enum: Object.values(config.status),
    default: config.status.Reserve,
  },
  type: {
    type: Number,
    enum: Object.values(config.problemType),
    default: config.problemType.Traditional,
  },
  code: {
    type: String,
    default: '',
  },
  tags: {
    type: [ mongoose.Schema.Types.ObjectId ],
    ref: 'Tag',
    default: [],
    index: true,
    validate: {
      validator (v: any) {
        return Array.isArray(v)
          && v.every(id => mongoose.Types.ObjectId.isValid(id))
      },
      message: 'Invalid tag ID array',
    },
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
    validate: {
      validator (v: any) {
        return v === null || mongoose.Types.ObjectId.isValid(v)
      },
      message: 'Invalid owner ID',
    },
  },
  submit: {
    type: Number,
    default: 0,
  },
  solve: {
    type: Number,
    default: 0,
  },
}, {
  collection: 'Problem',
  timestamps: true,
})

problemSchema.plugin(mongoosePaginate)

problemSchema.pre('save', async function (this: ProblemDocument) {
  if (this.pid === -1) {
    this.pid = await ID.generateId('Problem')
  }
})

const Problem
  = mongoose.model<ProblemDocument, CourseModel>(
    'Problem', problemSchema,
  )

export default Problem
