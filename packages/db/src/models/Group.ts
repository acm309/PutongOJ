import type { GroupEntity } from '@putong-oj/shared'
import type { Document, PaginateModel, Types } from 'mongoose'
import mongoosePaginate from 'mongoose-paginate-v2'
import mongoose from '../client.js'
import ID from './ID.js'

export type GroupDocument = {} & Document<Types.ObjectId> & GroupEntity

type GroupModel = PaginateModel<GroupDocument>

const groupSchema = new mongoose.Schema({
  gid: {
    type: Number,
    index: {
      unique: true,
    },
    default: -1,
  },
  title: {
    type: String,
    required: true,
    validate: {
      validator: (v: string) => v.length > 3 && v.length < 80,
      message: 'The length of the title should be between 4 and 79 characters',
    },
  },
  list: {
    type: [ String ],
    default: [],
  },
  create: {
    type: Number,
    default: Date.now,
  },
}, {
  collection: 'Group',
  timestamps: true,
})

groupSchema.plugin(mongoosePaginate)

groupSchema.pre('save', async function () {
  if (this.gid === -1) {
    this.gid = await ID.generateId('Group')
  }
})

const Group
  = mongoose.model<GroupDocument, GroupModel>(
    'Group',
    groupSchema,
  )

export default Group
