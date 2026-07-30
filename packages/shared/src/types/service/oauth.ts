import { z } from 'zod'
import { OAuthFieldsSchema } from '../fields/oauth.js'

export const OAuthUserProfileSchema = z.object({
  provider: OAuthFieldsSchema.shape.provider,
  providerId: OAuthFieldsSchema.shape.providerId,
  displayName: OAuthFieldsSchema.shape.displayName,
  raw: OAuthFieldsSchema.shape.raw,
})

export type OAuthUserProfile = z.infer<typeof OAuthUserProfileSchema>

export const OAuthConnectionSchema = OAuthUserProfileSchema.extend({
  accessToken: OAuthFieldsSchema.shape.accessToken,
  refreshToken: OAuthFieldsSchema.shape.refreshToken,
})

export type OAuthConnection = z.infer<typeof OAuthConnectionSchema>
