import { LabelingStyle, TITLE_LENGTH_MAX } from '@putongoj/shared'
import mongoose from '../config/db'
import ID from './ID'

const contestSchema = new mongoose.Schema({
  contestId: {
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
      validator: (v: string) => v.length >= 1 && v.length <= TITLE_LENGTH_MAX,
    },
  },
  startsAt: {
    type: Date,
    required: true,
  },
  endsAt: {
    type: Date,
    required: true,
  },
  scoreboardFrozenAt: {
    type: Date,
    default: null,
  },
  scoreboardUnfrozenAt: {
    type: Date,
    default: null,
  },
  isHidden: {
    type: Boolean,
    default: false,
  },
  isLocked: {
    type: Boolean,
    default: false,
  },
  isPublic: {
    type: Boolean,
    default: false,
  },
  password: {
    type: String,
    default: '',
  },
  allowedUsers: [ {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  } ],
  allowedGroups: [ {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Group',
  } ],
  ipWhitelist: [ {
    cidr: {
      type: String,
      required: true,
    },
    comment: {
      type: String,
      default: null,
      validate: {
        validator: (v: string | null) => v === null || v.length <= 100,
      },
    },
  } ],
  ipWhitelistEnabled: {
    type: Boolean,
    default: false,
  },
  problems: [ {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Problem',
  } ],
  labelingStyle: {
    type: Number,
    enum: Object.values(LabelingStyle),
    default: LabelingStyle.Numeric,
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    default: null,
  },
}, {
  collection: 'Contest',
  timestamps: true,
})

contestSchema.pre('save', async function (this) {
  if (this.contestId === -1) {
    this.contestId = await ID.generateId('Contest')
  }
})

const Contest = mongoose.model('Contest', contestSchema)

export default Contest
