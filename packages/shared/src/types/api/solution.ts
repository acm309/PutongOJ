import { z } from 'zod'
import { JudgeStatus, status } from '@/consts/index.js'
import { isoDatetimeToDate } from '../codec.js'
import { ContestModelSchema } from '../model/contest.js'
import { ProblemModelSchema } from '../model/problem.js'
import { SolutionModelSchema } from '../model/solution.js'

export const SolutionSubmitPayloadSchema = z.object({
  problem: ProblemModelSchema.shape.pid.int().positive(),
  contest: ContestModelSchema.shape.contestId.int().positive().optional(),
  language: SolutionModelSchema.shape.language,
  code: SolutionModelSchema.shape.code.min(8).max(16384),
})

export type SolutionSubmitPayload = z.infer<typeof SolutionSubmitPayloadSchema>

export const SolutionSubmitResultSchema = z.object({
  sid: SolutionModelSchema.shape.sid,
})

export type SolutionSubmitResult = z.input<typeof SolutionSubmitResultSchema>

const SolutionTestcaseResultSchema = z.object({
  uuid: z.string(),
  judge: z.enum(JudgeStatus),
  time: z.int().nonnegative(),
  memory: z.int().nonnegative(),
})

const SolutionFieldsSchema = z.object({
  sid: SolutionModelSchema.shape.sid,
  pid: SolutionModelSchema.shape.pid,
  uid: SolutionModelSchema.shape.uid,
  mid: SolutionModelSchema.shape.mid,
  course: z.string().nullable().optional(),
  code: SolutionModelSchema.shape.code,
  length: SolutionModelSchema.shape.length,
  language: SolutionModelSchema.shape.language,
  create: z.int().nonnegative(),
  status: z.enum(status),
  judge: SolutionModelSchema.shape.judge,
  time: SolutionModelSchema.shape.time,
  memory: SolutionModelSchema.shape.memory,
  error: SolutionModelSchema.shape.error,
  sim: SolutionModelSchema.shape.sim,
  sim_s_id: SolutionModelSchema.shape.sim_s_id,
  testcases: z.array(SolutionTestcaseResultSchema),
  createdAt: isoDatetimeToDate,
  updatedAt: isoDatetimeToDate,
})

export const SolutionDetailQueryResultSchema = SolutionFieldsSchema.omit({
  length: true,
  status: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  status: z.enum(status).optional(),
  simSolution: z.object({
    sid: SolutionModelSchema.shape.sid,
    uid: SolutionModelSchema.shape.uid,
    code: SolutionModelSchema.shape.code,
    create: z.int().nonnegative(),
  }).optional(),
})

export type SolutionDetailQueryResult = z.input<typeof SolutionDetailQueryResultSchema>

export const SolutionUpdateQueryResultSchema = SolutionFieldsSchema

export type SolutionUpdateQueryResult = z.input<typeof SolutionUpdateQueryResultSchema>

export const SolutionStatusUpdatePayloadSchema = z.object({
  judge: z.union([
    z.literal(JudgeStatus.RejudgePending),
    z.literal(JudgeStatus.Skipped),
  ]),
})

export type SolutionStatusUpdatePayload = z.infer<typeof SolutionStatusUpdatePayloadSchema>
