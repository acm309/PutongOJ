import { z } from 'zod'
import { problemType } from '../../consts/domain.js'
import { JudgeStatus, Language } from '../../consts/index.js'

export const JudgerProblemTypeValues = [
  problemType.Traditional,
  problemType.Interaction,
  problemType.SpecialJudge,
] as const

export const JudgerProblemTypeSchema = z.union([
  z.literal(problemType.Traditional),
  z.literal(problemType.Interaction),
  z.literal(problemType.SpecialJudge),
])

export const JudgerLocalFileSchema = z.object({
  src: z.string(),
})

export const JudgerMemoryFileSchema = z.object({
  content: z.string(),
})

export const JudgerPreparedFileSchema = z.object({
  fileId: z.string(),
})

export const JudgerFileSchema = z.union([
  JudgerLocalFileSchema,
  JudgerMemoryFileSchema,
  JudgerPreparedFileSchema,
])

export type JudgerFile = z.infer<typeof JudgerFileSchema>

export const JudgerTestcaseSchema = z.object({
  uuid: z.string(),
  input: JudgerFileSchema,
  output: JudgerFileSchema,
})

export type JudgerTestcase = z.infer<typeof JudgerTestcaseSchema>

export const JudgerTaskSchema = z.object({
  sid: z.int().positive(),
  timeLimit: z.int().positive(),
  memoryLimit: z.int().positive(),
  testcases: z.array(JudgerTestcaseSchema),
  language: z.enum(Language),
  code: z.string(),
  type: JudgerProblemTypeSchema.default(problemType.Traditional),
  additionCode: z.string().default(''),
})

export type JudgerTask = z.infer<typeof JudgerTaskSchema>

export const JudgerTestcaseResultSchema = z.object({
  uuid: z.string(),
  time: z.int().nonnegative().default(0),
  memory: z.int().nonnegative().default(0),
  judge: z.enum(JudgeStatus).default(JudgeStatus.Pending),
})

export type JudgerTestcaseResult = z.infer<typeof JudgerTestcaseResultSchema>

export const JudgerResultSchema = z.object({
  sid: z.int().nonnegative(),
  time: z.int().nonnegative().default(0),
  memory: z.int().nonnegative().default(0),
  testcases: z.array(JudgerTestcaseResultSchema).default([]),
  judge: z.enum(JudgeStatus).default(JudgeStatus.Pending),
  error: z.string().default(''),
})

export type JudgerResult = z.infer<typeof JudgerResultSchema>
