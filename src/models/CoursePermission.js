const mongoose = require('mongoose')
const mongoosePaginate = require('mongoose-paginate-v2')
const { coursePermission } = require('../config')

const CoursePermissionSchema = new mongoose.Schema({
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

CoursePermissionSchema.plugin(mongoosePaginate)

CoursePermissionSchema.index({
  course: 1,
  user: 1,
}, { unique: true })
CoursePermissionSchema.index({
  course: 1,
  role: 1,
}, { unique: false })

module.exports = mongoose.model('CoursePermission', CoursePermissionSchema)
