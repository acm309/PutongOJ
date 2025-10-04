import { z } from 'zod'
import { UserModelSchema } from '../model/user.js'

export const AccountSessionSchema = z.object({
  uid: UserModelSchema.shape.uid,
  privilege: UserModelSchema.shape.privilege,
  checksum: z.base64(),
  verifyContest: z.array(z.number()).optional(),
})

export type AccountSession = z.infer<typeof AccountSessionSchema>

export const AccountProfileQueryResultSchema = z.object({
  uid: UserModelSchema.shape.uid,
  privilege: UserModelSchema.shape.privilege,
  nick: UserModelSchema.shape.nick,
  motto: UserModelSchema.shape.motto,
  mail: UserModelSchema.shape.mail,
  school: UserModelSchema.shape.school,
  verifyContest: AccountSessionSchema.shape.verifyContest,
})

export type AccountProfileQueryResult = z.input<typeof AccountProfileQueryResultSchema>

export const AccountLoginPayloadSchema = z.object({
  username: UserModelSchema.shape.uid,
  password: z.base64(),
})

export type AccountLoginPayload = z.infer<typeof AccountLoginPayloadSchema>

export const AccountRegisterPayloadSchema = z.object({
  username: UserModelSchema.shape.uid,
  password: z.base64(),
})

export type AccountRegisterPayload = z.infer<typeof AccountRegisterPayloadSchema>

export const AccountEditPayloadSchema = z.object({
  nick: UserModelSchema.shape.nick.optional(),
  motto: UserModelSchema.shape.motto.optional(),
  mail: UserModelSchema.shape.mail.optional(),
  school: UserModelSchema.shape.school.optional(),
})

export type AccountEditPayload = z.infer<typeof AccountEditPayloadSchema>

export const AccountChangePasswordPayloadSchema = z.object({
  oldPassword: z.base64(),
  newPassword: z.base64(),
})

export type AccountChangePasswordPayload = z.infer<typeof AccountChangePasswordPayloadSchema>
