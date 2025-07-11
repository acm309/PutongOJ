import type { Document, PaginateModel, Schema } from 'mongoose'
import type { UserEntity } from '../types/entity'
import mongoose from 'mongoose'
import mongoosePaginate from 'mongoose-paginate-v2'
import { privilege } from '../utils/constants'

export interface UserDocument extends Document, UserEntity {
  isBanned: boolean
  isAdmin: boolean
  isRoot: boolean
}

type UserModel = PaginateModel<UserDocument>

const userSchema: Schema = new mongoose.Schema({
  uid: {
    type: String,
    required: true,
    validate: {
      validator (v: string) {
        return /^[\w-]{3,20}$/.test(v)
      },
      message:
        'Invalid uid. It should be 3-20 characters long '
        + 'and only contains letters, numbers, dash and underscore',
    },
    immutable: true,
    index: {
      unique: true,
    },
  },
  pwd: {
    type: String,
    required: true,
  },
  privilege: {
    type: Number,
    enum: Object.values(privilege),
    default: privilege.User,
  },
  nick: {
    type: String,
    default: '',
    validate: {
      validator (v: string) {
        return v.length <= 30
      },
      message:
        'Nick is too long. It should be less than 30 characters long',
    },
  },
  motto: {
    type: String,
    default: '',
    validate: {
      validator (v: string) {
        return v.length <= 300
      },
      message:
        'Motto is too long. It should be less than 300 characters long',
    },
  },
  mail: {
    type: String,
    default: '',
    validate: {
      validator (v: string) {
        return v.length === 0 || (v.length <= 254
          && /^[\w.%+-]{1,64}@[a-z0-9.-]{1,255}\.[a-z]{2,}$/i.test(v))
      },
      message: 'Invalid email address',
    },
  },
  school: {
    type: String,
    default: '',
    validate: {
      validator (v: string) {
        return v.length <= 30
      },
      message:
        'School name is too long. It should be less than 30 characters long',
    },
  },
  gid: {
    type: [ Number ],
    default: [],
    index: true,
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
  collection: 'User',
  timestamps: true,
})

userSchema.plugin(mongoosePaginate)

userSchema.virtual('isBanned').get(function (this: UserDocument): boolean {
  return this.privilege === privilege.Banned
})
userSchema.virtual('isAdmin').get(function (this: UserDocument): boolean {
  return this.privilege >= privilege.Admin
})
userSchema.virtual('isRoot').get(function (this: UserDocument): boolean {
  return this.privilege >= privilege.Root
})

const User: UserModel
  = mongoose.model<UserDocument, UserModel>(
    'User', userSchema,
  )

export default module.exports = User
