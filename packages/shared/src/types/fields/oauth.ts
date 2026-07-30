import { z } from 'zod'
import { OAuthProvider } from '@/consts/index.js'
import { isoDatetimeToDate } from '../codec.js'

export const OAuthFieldsSchema = z.object({
  userId: z.int().positive(),
  provider: z.enum(OAuthProvider),
  providerId: z.string(),
  displayName: z.string(),
  raw: z.unknown(),
  accessToken: z.string(),
  refreshToken: z.string().nullable(),
  createdAt: isoDatetimeToDate,
  updatedAt: isoDatetimeToDate,
})
