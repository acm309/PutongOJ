import type { Document, PaginateModel, Types } from 'mongoose'
import type { CourseEntity } from '../types/entity'
import mongoosePaginate from 'mongoose-paginate-v2'
import mongoose from '../config/db'
import { encrypt } from '../utils/constants'
import ID from './ID'

export interface CourseDocument extends Document<Types.ObjectId>, CourseEntity {
  isPublic: boolean
  isPrivate: boolean
  canJoin: boolean
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
  joinCode: {
    type: String,
    default: '',
    validate: {
      validator (v: string) {
        return v.length === 0 || (v.length >= 6 && v.length <= 20)
      },
      message:
        'Join code is too short or too long. It should be 6-20 characters long',
    },
  },
}, {
  collection: 'Course',
  timestamps: true,
})

courseSchema.plugin(mongoosePaginate)

courseSchema.virtual('isPublic').get(function (this: CourseDocument): boolean {
  return this.encrypt === encrypt.Public
})
courseSchema.virtual('isPrivate').get(function (this: CourseDocument): boolean {
  return this.encrypt === encrypt.Private
})
courseSchema.virtual('canJoin').get(function (this: CourseDocument): boolean {
  return (this.joinCode?.length ?? 0) > 0
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

export default Course
