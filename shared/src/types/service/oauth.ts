import { z } from 'zod'
import { OAuthModelSchema } from '../model/oauth.js'

export const OAuthUserProfileSchema = z.object({
  provider: OAuthModelSchema.shape.provider,
  providerId: OAuthModelSchema.shape.providerId,
  displayName: OAuthModelSchema.shape.displayName,
  raw: OAuthModelSchema.shape.raw,
})

export type OAuthUserProfile = z.infer<typeof OAuthUserProfileSchema>

export const OAuthConnectionSchema = OAuthUserProfileSchema.extend({
  accessToken: OAuthModelSchema.shape.accessToken,
  refreshToken: OAuthModelSchema.shape.refreshToken,
})

export type OAuthConnection = z.infer<typeof OAuthConnectionSchema>
