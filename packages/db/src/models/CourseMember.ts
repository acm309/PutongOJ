import type { CourseMemberEntity, CourseMemberView, UserEntity } from '@putong-oj/shared'
import type { Document, PaginateModel, Types } from 'mongoose'
import { courseRoleNone } from '@putong-oj/shared'
import mongoosePaginate from 'mongoose-paginate-v2'
import mongoose from '../client.js'

export type CourseMemberDocument = { } & Document<Types.ObjectId> & CourseMemberEntity

type CourseMemberModel = {
  toView: (
    courseMember: Partial<CourseMemberEntity> | null,
    user: Partial<Pick<UserEntity, 'uid' | 'nick' | 'privilege'>> | null,
  ) => CourseMemberView
} & PaginateModel<CourseMemberDocument>

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

courseMemberSchema.statics.toView = function (
  courseMember: Partial<CourseMemberEntity> | null,
  user: Partial<Pick<UserEntity, 'uid' | 'nick' | 'privilege'>> | null,
): CourseMemberView {
  return {
    user: {
      uid: user?.uid ?? 'ghost',
      nick: user?.nick ?? '',
      privilege: user?.privilege ?? 0,
    },
    role: courseMember?.role ?? courseRoleNone,
    createdAt: new Date(courseMember?.createdAt ?? Date.now()).getTime(),
    updatedAt: new Date(courseMember?.updatedAt ?? Date.now()).getTime(),
  }
}

const CourseMember
  = mongoose.model<CourseMemberDocument, CourseMemberModel>(
    'CourseMember',
    courseMemberSchema,
  )

export default CourseMember
