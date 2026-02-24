import type { Document, PaginateModel, Types } from 'mongoose'
import type { SolutionEntity } from '../types/entity'
import { JudgeStatus, JudgeStatusValues } from '@putongoj/shared'
import mongoosePaginate from 'mongoose-paginate-v2'
import mongoose from '../config/db'
import { status } from '../utils/constants'
import ID from './ID'

export interface SolutionDocument extends Document<Types.ObjectId>, SolutionEntity {
  isAccepted: boolean
  isPending: boolean
}

type SolutionModel = PaginateModel<SolutionDocument>

const testcaseResultSchema = new mongoose.Schema({
  uuid: {
    type: String,
    required: true,
  },
  judge: {
    type: Number,
    required: true,
  },
  time: {
    type: Number,
    required: true,
  },
  memory: {
    type: Number,
    required: true,
  },
}, {
  _id: false,
})

const solutionSchema = new mongoose.Schema({
  sid: {
    type: Number,
    default: -1,
    immutable: true,
    index: {
      unique: true,
    },
  },
  pid: {
    type: Number,
    immutable: true,
    index: true,
    required: true,
  },
  uid: {
    type: String,
    immutable: true,
    index: true,
    required: true,
  },
  mid: { // mid 指代 contest id (历史遗留问题)
    type: Number,
    default: -1,
    immutable: true,
    index: true,
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
  code: {
    type: String,
    immutable: true,
    required: true,
    validate: {
      validator (v: any) {
        return v.length >= 8 && v.length <= 16384
      },
      message:
        'The length of code should be greater than 8 and less than 16384',
    },
  },
  length: {
    type: Number,
    immutable: true,
    required: true,
  },
  language: {
    type: Number,
    immutable: true,
    index: true,
    required: true,
  },
  create: {
    type: Number,
    default: Date.now,
    immutable: true,
  },
  status: {
    type: Number,
    enum: Object.values(status),
    default: status.Available,
  },
  judge: {
    type: Number,
    enum: JudgeStatusValues,
    default: JudgeStatus.Pending,
    index: true,
  },
  time: {
    type: Number,
    default: 0,
  },
  memory: {
    type: Number,
    default: 0,
  },
  error: {
    type: String,
    default: '',
  },
  sim: {
    type: Number,
    default: 0,
  },
  sim_s_id: {
    type: Number,
    default: 0,
  },
  testcases: {
    type: [ testcaseResultSchema ],
    default: [],
  },
}, {
  collection: 'Solution',
  timestamps: true,
})

solutionSchema.plugin(mongoosePaginate)

solutionSchema.virtual('isAccepted').get(function () {
  return this.judge === JudgeStatus.Accepted
})
solutionSchema.virtual('isPending').get(function () {
  return this.judge === JudgeStatus.Pending
})

solutionSchema.index({ createdAt: -1 })
solutionSchema.index({ judge: 1, createdAt: -1 })
solutionSchema.index({ uid: 1, createdAt: -1 })
solutionSchema.index({ pid: 1, createdAt: -1 })
solutionSchema.index({ mid: 1, createdAt: -1 })
solutionSchema.index({ language: 1, createdAt: -1 })

solutionSchema.pre('save', async function () {
  if (this.sid === -1) {
    this.sid = await ID.generateId('Solution')
  }
})

const Solution
  = mongoose.model<SolutionDocument, SolutionModel>(
    'Solution', solutionSchema,
  )

export default Solution
