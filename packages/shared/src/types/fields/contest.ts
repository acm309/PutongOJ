import { z } from 'zod'
import { LabelingStyle, Language, ParticipationStatus } from '@/consts/index.js'
import { TITLE_LENGTH_MAX } from '@/consts/limit.js'
import { isoDatetimeToDate } from '../codec.js'

export const ContestFieldsSchema = z.object({
  id: z.int().positive(),
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

  ipWhitelistEnabled: z.boolean(),
  allowEarlyExit: z.boolean(),
  allowedLanguages: z.array(z.enum(Language)),
  labelingStyle: z.enum(LabelingStyle),
  courseId: z.int().positive().nullable(),

  createdAt: isoDatetimeToDate,
  updatedAt: isoDatetimeToDate,
})

export const ContestParticipationFieldsSchema = z.object({
  contestId: z.int().positive(),
  userId: z.int().positive(),
  status: z.enum(ParticipationStatus),
  createdAt: isoDatetimeToDate,
  updatedAt: isoDatetimeToDate,
})
