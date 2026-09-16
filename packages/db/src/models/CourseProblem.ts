import type { CourseProblemEntity } from '@putong-oj/shared'
import type { Document, Model, Types } from 'mongoose'
import mongoose from '../client.js'

export type CourseProblemDocument = { } & Document<Types.ObjectId> & CourseProblemEntity

type CourseProblemModel = {} & Model<CourseProblemDocument>

const courseProblemSchema = new mongoose.Schema({
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true,
    immutable: true,
  },
  problem: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Problem',
    required: true,
    immutable: true,
  },
  sort: {
    type: Number,
    default: 0,
  },
}, {
  collection: 'CourseProblem',
  timestamps: true,
})

courseProblemSchema.index({
  course: 1,
  problem: 1,
}, { unique: true })
courseProblemSchema.index({
  course: 1,
})

const CourseProblem
  = mongoose.model<CourseProblemDocument, CourseProblemModel>(
    'CourseProblem',
    courseProblemSchema,
  )

export default CourseProblem
