import { z } from 'zod'
import { UserAvatarSchema } from '../../model/user.js'

export const AvatarPresetsEditPayloadSchema = z.object({
  avatarPresets: z.array(UserAvatarSchema),
})

export type AvatarPresetsEditPayload = z.infer<typeof AvatarPresetsEditPayloadSchema>
