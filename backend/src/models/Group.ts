import type { Document, PaginateModel, Types } from 'mongoose'
import type { GroupEntity } from '../types/entity'
import mongoosePaginate from 'mongoose-paginate-v2'
import mongoose from '../config/db'
import ID from './ID'

export interface GroupDocument extends Document<Types.ObjectId>, GroupEntity {}

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

groupSchema.pre('save', async function (next) {
  if (this.gid === -1) {
    this.gid = await ID.generateId('Group')
  }
  next()
})

const Group
  = mongoose.model<GroupDocument, GroupModel>(
    'Group', groupSchema,
  )

export default Group
