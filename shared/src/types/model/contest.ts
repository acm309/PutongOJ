import { z } from 'zod'
import { LabelingStyle } from '@/consts/index.js'
import { TITLE_LENGTH_MAX } from '@/consts/limit.js'
import { isoDatetimeToDate } from '../codec.js'
import { ObjectIdSchema } from '../utils.js'

export const ContestModelSchema = z.object({
  /** Contest Id */
  contestId: z.number(),
  /** Contest title */
  title: z.string().min(1).max(TITLE_LENGTH_MAX),

  /** Time contest starts, problems opened and accepting submissions */
  startsAt: isoDatetimeToDate,
  /** Time contest ends, stop accepting submissions */
  endsAt: isoDatetimeToDate,
  /** Time scoreboard is frozen, null if never */
  scoreboardFrozenAt: isoDatetimeToDate.nullable(),
  /** Time scoreboard is unfrozen, null if never */
  scoreboardUnfrozenAt: isoDatetimeToDate.nullable(),

  /** Is the contest hidden from the contest list */
  isHidden: z.boolean(),
  /** Is the contest locked for modification */
  isLocked: z.boolean(),
  /** Is the contest public, everyone can participate */
  isPublic: z.boolean(),

  /** Password for accessing the contest, null if unable */
  password: z.string().nullable(),
  /** List of users allowed to access the contest */
  allowedUsers: z.array(ObjectIdSchema),
  /** List of groups allowed to access the contest */
  allowedGroups: z.array(ObjectIdSchema),
  /** IP whitelist for accessing the contest */
  ipWhitelist: z.array(z.object({
    cidr: z.union([z.cidrv4(), z.cidrv6()]),
    comment: z.string().max(100).nullable(),
  })),
  /** Is IP whitelist enabled */
  ipWhitelistEnabled: z.boolean(),

  /** List of problems in the contest */
  problems: z.array(ObjectIdSchema),
  /** Labeling style for problems */
  labelingStyle: z.enum(LabelingStyle),

  /** Associated course, null if none */
  course: ObjectIdSchema.nullable(),

  createdAt: isoDatetimeToDate,
  updatedAt: isoDatetimeToDate,
})

export type ContestModel = z.infer<typeof ContestModelSchema>
