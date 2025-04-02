const mongoose = require('mongoose')
const mongoosePaginate = require('mongoose-paginate-v2')
const { permission } = require('../config')

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
    enum: Object.values(permission),
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
  userId: 1,
  courseId: 1,
}, {
  unique: true,
})

module.exports = mongoose.model('CoursePermission', CoursePermissionSchema)
