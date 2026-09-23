import type { GroupEntity } from '@putong-oj/shared'
import type { Document, PaginateModel, Types } from 'mongoose'
import mongoosePaginate from 'mongoose-paginate-v2'
import mongoose from '../client.js'

export type GroupDocument = {} & Document<Types.ObjectId> & GroupEntity

type GroupModel = PaginateModel<GroupDocument>

const groupSchema = new mongoose.Schema({
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

const Group
  = mongoose.model<GroupDocument, GroupModel>(
    'Group',
    groupSchema,
  )

export default Group
