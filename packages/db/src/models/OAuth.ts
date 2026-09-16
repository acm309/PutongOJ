import type { Model } from 'mongoose'
import type { OAuthDocument } from '../types.js'
import mongoose from '../client.js'

type OAuthModel = Model<OAuthDocument>

const oauthSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    immutable: true,
  },
  provider: {
    type: String,
    required: true,
    immutable: true,
  },
  providerId: {
    type: String,
    required: true,
    immutable: true,
  },
  displayName: {
    type: String,
    required: true,
  },
  accessToken: {
    type: String,
    required: true,
  },
  refreshToken: {
    type: String,
    required: false,
    default: null,
  },
  raw: {
    type: mongoose.Schema.Types.Mixed,
    required: false,
    default: null,
  },
}, {
  collection: 'OAuth',
  timestamps: true,
})

oauthSchema.index({ user: 1, provider: 1 }, { unique: true })
oauthSchema.index({ provider: 1, providerId: 1 }, { unique: true })

const OAuth
  = mongoose.model<OAuthDocument, OAuthModel>(
    'OAuth',
    oauthSchema,
  )

export default OAuth
