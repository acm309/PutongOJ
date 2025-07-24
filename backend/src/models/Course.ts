import type { Document, PaginateModel } from 'mongoose'
import type { CourseEntity } from '../types/entity'
import mongoose from 'mongoose'
import mongoosePaginate from 'mongoose-paginate-v2'
import { encrypt } from '../utils/constants'
import ID from './ID'

export interface CourseDocument extends Document, CourseEntity {
  isPublic: boolean
  isPrivate: boolean
}

type CourseModel = PaginateModel<CourseDocument>

const courseSchema = new mongoose.Schema({
  courseId: {
    type: Number,
    index: {
      unique: true,
    },
    default: -1,
  },
  name: {
    type: String,
    required: true,
    validate: {
      validator (v: any) {
        return v.length >= 3 && v.length <= 30
      },
      message:
        'Name is too short or too long. It should be 3-30 characters long',
    },
  },
  description: {
    type: String,
    default: '',
    validate: {
      validator (v: any) {
        return v.length <= 100
      },
      message:
        'Description is too long. It should be less than 100 characters long',
    },
  },
  encrypt: {
    type: Number,
    enum: [ encrypt.Public, encrypt.Private ],
    default: encrypt.Public,
  },
}, {
  collection: 'Course',
  timestamps: true,
})

courseSchema.plugin(mongoosePaginate)

courseSchema.virtual('isPublic').get(function (this: CourseDocument) {
  return this.encrypt === encrypt.Public
})
courseSchema.virtual('isPrivate').get(function (this: CourseDocument) {
  return this.encrypt === encrypt.Private
})

courseSchema.pre('save', async function (this: CourseDocument, next) {
  if (this.courseId === -1) {
    this.courseId = await ID.generateId('Course')
  }
  next()
})

const Course
  = mongoose.model<CourseDocument, CourseModel>(
    'Course', courseSchema,
  )

export default module.exports = Course
