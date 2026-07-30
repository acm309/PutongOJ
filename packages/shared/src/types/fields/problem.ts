import { z } from 'zod'
import { ProblemJudgeType, ProblemVisibility } from '@/consts/index.js'
import { isoDatetimeToDate } from '../codec.js'

export const ProblemFieldsSchema = z.object({
  id: z.int().positive(),
  title: z.string().min(1).max(80),
  timeLimitMs: z.int().positive(),
  memoryLimitKb: z.int().positive(),
  description: z.string(),
  inputFormat: z.string(),
  outputFormat: z.string(),
  sampleInput: z.string(),
  sampleOutput: z.string(),
  hint: z.string(),
  visibility: z.enum(ProblemVisibility),
  judgeType: z.enum(ProblemJudgeType),
  judgeCode: z.string(),
  ownerId: z.int().positive().nullable(),
  createdAt: isoDatetimeToDate,
  updatedAt: isoDatetimeToDate,
})
