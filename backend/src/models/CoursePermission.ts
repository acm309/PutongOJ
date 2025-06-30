import mongoose from 'mongoose'
import mongoosePaginate from 'mongoose-paginate-v2'
import constants from '../utils/constants'

const { coursePermission } = constants

const coursePermissionSchema = new mongoose.Schema({
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
    type: Number,
    default: coursePermission.Basic,
    min: coursePermission.Basic,
    max: coursePermission.Entire,
    required: true,
  },
  create: {
    type: Number,
    default: Date.now,
    immutable: true,
  },
  update: {
    type: Number,
    default: Date.now,
  },
}, {
  collection: 'CoursePermission',
})

coursePermissionSchema.plugin(mongoosePaginate)

coursePermissionSchema.index({
  course: 1,
  user: 1,
}, { unique: true })
coursePermissionSchema.index({
  course: 1,
  role: 1,
}, { unique: false })

module.exports = mongoose.model('CoursePermission', coursePermissionSchema)
