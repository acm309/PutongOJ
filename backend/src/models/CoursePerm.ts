import type { Document, PaginateModel } from 'mongoose'
import type { CoursePermEntity } from '../types/entity'
import mongoose from 'mongoose'
import mongoosePaginate from 'mongoose-paginate-v2'

export interface CoursePermDocument extends Document, CoursePermEntity {}

type CoursePermModel = PaginateModel<CoursePermDocument>

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

const coursePermSchema = new mongoose.Schema({
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
    required: true,
  },
}, {
  collection: 'CoursePerm',
  timestamps: true,
})

coursePermSchema.plugin(mongoosePaginate)

coursePermSchema.index({
  course: 1,
  user: 1,
}, { unique: true })
coursePermSchema.index({
  course: 1,
})
coursePermSchema.index({
  user: 1,
})

const CoursePerm
  = mongoose.model<CoursePermDocument, CoursePermModel>(
    'CoursePerm', coursePermSchema,
  )

export default module.exports = CoursePerm
