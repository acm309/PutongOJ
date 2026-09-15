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
  mid: z.union([z.int().nonnegative(), z.literal(-1)]),
  course: ObjectIdSchema.nullable().optional(),
  code: z.string(),
  length: z.int().nonnegative(),
  language: z.enum(Language),
  judge: z.enum(JudgeStatus),
  time: z.int().nonnegative(),
  memory: z.int().nonnegative(),
  error: z.string(),
  sim: z.number(),
  sim_s_id: z.number(),
  testcase: z.array(TestcaseResultSchema),
  createdAt: z.date(),
  updatedAt: z.date(),
})

export type SolutionModel = z.infer<typeof SolutionModelSchema>
