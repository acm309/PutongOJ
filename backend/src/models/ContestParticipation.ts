import { ParticipationStatus } from '@putongoj/shared'
import mongoose from '../config/db'

const contestParticipationSchema = new mongoose.Schema({
  contest: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Contest',
    required: true,
    immutable: true,
    index: true,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    immutable: true,
    index: true,
  },
  status: {
    type: Number,
    enum: ParticipationStatus,
    required: true,
  },
}, {
  collection: 'ContestParticipation',
  timestamps: true,
})

contestParticipationSchema.index({
  contest: 1,
  user: 1,
}, { unique: true })
contestParticipationSchema.index({
  contest: 1,
  status: 1,
  updatedAt: -1,
})

const ContestParticipation = mongoose.model(
  'ContestParticipation', contestParticipationSchema)

export default ContestParticipation
