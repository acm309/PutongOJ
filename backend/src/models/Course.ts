import mongoose from 'mongoose'
import mongoosePaginate from 'mongoose-paginate-v2'
import config from '../config'
import ID from './ID'

const courseSchema = new mongoose.Schema({
  id: {
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
      validator (v: string) {
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
      validator (v: string) {
        return v.length <= 100
      },
      message:
        'Description is too long. It should be less than 100 characters long',
    },
  },
  encrypt: {
    type: Number,
    enum: [ config.encrypt.Public, config.encrypt.Private ],
    default: config.encrypt.Public,
  },
  create: {
    type: Number,
    default: Date.now,
    immutable: true,
  },
}, {
  collection: 'Course',
})

courseSchema.plugin(mongoosePaginate)

courseSchema.pre('save', async function (next) {
  if (this.id === -1) {
    this.id = await ID.generateId('Course')
  }
  next()
})

module.exports = mongoose.model('Course', courseSchema)
