import type { Document, Model } from 'mongoose'
import type { CourseProblemEntity } from '../types/entity'
import mongoose from 'mongoose'

export interface CourseProblemDocument extends Document, CourseProblemEntity { }

interface CourseProblemModel extends Model<CourseProblemDocument> {}

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
    'CourseProblem', courseProblemSchema,
  )

export default module.exports = CourseProblem
