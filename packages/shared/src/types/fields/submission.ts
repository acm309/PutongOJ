import { z } from 'zod'
import { JudgeStatus, Language } from '@/consts/index.js'
import { isoDatetimeToDate } from '../codec.js'

const TestcaseResultSchema = z.object({
  testcaseId: z.string(),
  status: z.enum(JudgeStatus),
  timeUsedMs: z.int().nonnegative(),
  memoryUsedKb: z.int().nonnegative(),
})

export const SubmissionFieldsSchema = z.object({
  id: z.int().positive(),
  problemId: z.int().positive(),
  userId: z.int().positive(),
  contestId: z.int().positive().nullable(),
  courseId: z.int().positive().nullable(),
  sourceCode: z.string(),
  language: z.enum(Language),
  status: z.enum(JudgeStatus),
  timeUsedMs: z.int().nonnegative(),
  memoryUsedKb: z.int().nonnegative(),
  errorMessage: z.string(),
  similarity: z.number(),
  similarSubmissionId: z.int().positive().nullable(),
  testcaseResults: z.array(TestcaseResultSchema),
  createdAt: isoDatetimeToDate,
  updatedAt: isoDatetimeToDate,
})
