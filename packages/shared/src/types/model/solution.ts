import { z } from 'zod'
import { JudgeStatus, Language } from '@/consts/index.js'
import { ObjectIdSchema } from '../utils.js'

const TestcaseResultSchema = z.object({
  uuid: z.string(),
  judge: z.enum(JudgeStatus),
  time: z.int().nonnegative(),
  memory: z.int().nonnegative(),
})

export const SolutionModelSchema = z.object({
  sid: z.int().nonnegative(),
  pid: z.int().nonnegative(),
  uid: z.string(),
  contest: ObjectIdSchema.nullable(),
  course: ObjectIdSchema.nullable().optional(),
  code: z.string(),
  length: z.int().nonnegative(),
  language: z.enum(Language),
  judge: z.enum(JudgeStatus),
  time: z.int().nonnegative(),
  memory: z.int().nonnegative(),
  error: z.string(),
  similarity: z.number(),
  similarSolution: ObjectIdSchema.nullable(),
  testcases: z.array(TestcaseResultSchema),
  createdAt: z.date(),
  updatedAt: z.date(),
})

export type SolutionModel = z.infer<typeof SolutionModelSchema>
