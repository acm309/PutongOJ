import type { Document, PaginateModel } from 'mongoose'
import type { CourseMemberEntity } from '../types/entity'
import mongoose from 'mongoose'
import mongoosePaginate from 'mongoose-paginate-v2'

export interface CourseMemberDocument extends Document, CourseMemberEntity {}

type CourseMemberModel = PaginateModel<CourseMemberDocument>

const courseRoleSchema = new mongoose.Schema({
  basic: {
    type: Boolean,
    default: false,
  },
  viewTestcase: {
    type: Boolean,
    default: false,
  },
  viewSolution: {
    type: Boolean,
    default: false,
  },
  manageProblem: {
    type: Boolean,
    default: false,
  },
  manageContest: {
    type: Boolean,
    default: false,
  },
  manageCourse: {
    type: Boolean,
    default: false,
  },
}, {
  _id: false,
})

const courseMemberSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    immutable: true,
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true,
    immutable: true,
  },
  role: {
    type: courseRoleSchema,
  },
}, {
  collection: 'CourseMember',
  timestamps: true,
})

courseMemberSchema.plugin(mongoosePaginate)

courseMemberSchema.index({
  course: 1,
  user: 1,
}, { unique: true })
courseMemberSchema.index({
  course: 1,
})
courseMemberSchema.index({
  user: 1,
})

const CourseMember
  = mongoose.model<CourseMemberDocument, CourseMemberModel>(
    'CourseMember', courseMemberSchema,
  )

export default module.exports = CourseMember
