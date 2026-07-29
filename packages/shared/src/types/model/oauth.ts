import { z } from 'zod'
import { OAuthProvider } from '@/consts/index.js'
import { isoDatetimeToDate } from '../codec.js'
import { ObjectIdSchema } from '../utils.js'

export const OAuthModelSchema = z.object({
  user: ObjectIdSchema,
  provider: z.enum(OAuthProvider),
  providerId: z.string(),
  displayName: z.string(),
  raw: z.any().optional(),
  accessToken: z.string(),
  refreshToken: z.string().optional(),
  createdAt: isoDatetimeToDate,
  updatedAt: isoDatetimeToDate,
})

export type OAuthModel = z.infer<typeof OAuthModelSchema>
