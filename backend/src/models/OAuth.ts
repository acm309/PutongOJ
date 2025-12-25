import type { OAuthConnection } from '@putongoj/shared'
import type { Document, Model, Types } from 'mongoose'
import type { Entity, View } from '../types/entity'
import type { UserDocument } from './User'
import mongoose from '../config/db'

export interface OAuthEntity extends Entity, OAuthConnection {
  user: Types.ObjectId
}

export type OAuthEntityUserView = View & Pick<OAuthEntity,
  'providerId' | 'displayName'
>

export type OAuthDocument = Document<Types.ObjectId> & OAuthEntity

export type OAuthDocumentPopulated = OAuthDocument & {
  user: UserDocument
}

type OAuthModel = Model<OAuthDocument> & {
  toUserView: (oauth: Partial<OAuthEntity>) => OAuthEntityUserView
}

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

const toUserView = (oauth: Partial<OAuthEntity>): OAuthEntityUserView => {
  return {
    providerId: oauth.providerId ?? 'Unknown',
    displayName: oauth.displayName ?? 'Unknown',
    createdAt: new Date(oauth?.createdAt ?? Date.now()).getTime(),
    updatedAt: new Date(oauth?.updatedAt ?? Date.now()).getTime(),
  }
}

oauthSchema.statics.toUserView = toUserView

const OAuth
  = mongoose.model<OAuthDocument, OAuthModel>(
    'OAuth', oauthSchema,
  )

export default OAuth
