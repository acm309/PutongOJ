import { z } from 'zod'
import { OAuthAction, OAuthProvider } from '@/consts/index.js'
import { isoDatetimeToDate } from '../codec.js'

export const OAuthProviderSchema = z.enum(OAuthProvider)

export const OAuthGenerateUrlQuerySchema = z.object({
  action: z.enum(OAuthAction),
})

export type OAuthGenerateUrlQuery = z.infer<typeof OAuthGenerateUrlQuerySchema>

export const OAuthGenerateUrlQueryResultSchema = z.object({
  url: z.url(),
})

export type OAuthGenerateUrlQueryResult = z.input<typeof OAuthGenerateUrlQueryResultSchema>

export const OAuthCallbackQuerySchema = z.object({
  state: z.string().min(1),
  code: z.string().min(1),
})

export type OAuthCallbackQuery = z.infer<typeof OAuthCallbackQuerySchema>

export const OAuthConnectionUserViewSchema = z.object({
  providerId: z.string(),
  displayName: z.string(),
  createdAt: isoDatetimeToDate,
  updatedAt: isoDatetimeToDate,
})

export type OAuthConnectionUserView = z.input<typeof OAuthConnectionUserViewSchema>

export const OAuthCallbackQueryResultSchema = z.object({
  action: z.enum(OAuthAction),
  connection: OAuthConnectionUserViewSchema,
})

export type OAuthCallbackQueryResult = z.input<typeof OAuthCallbackQueryResultSchema>

export const OAuthUserConnectionsQueryResultSchema = z.record(
  z.enum(OAuthProvider),
  OAuthConnectionUserViewSchema.nullable(),
)

export type OAuthUserConnectionsQueryResult = z.input<typeof OAuthUserConnectionsQueryResultSchema>
