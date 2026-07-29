import mongoose from '../config/db'

const fileSchema = new mongoose.Schema({
  storageKey: {
    type: String,
    required: true,
    immutable: true,
    unique: true,
  },
  originalName: {
    type: String,
    required: true,
  },
  sizeBytes: {
    type: Number,
    required: true,
    min: 0,
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    immutable: true,
    index: true,
  },
  deletedAt: {
    type: Date,
    default: null,
    index: true,
  },
  deletedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
}, {
  collection: 'Files',
  timestamps: true,
})

fileSchema.index({ owner: 1, deletedAt: 1, createdAt: -1 })

const Files = mongoose.model('Files', fileSchema)

export default Files
