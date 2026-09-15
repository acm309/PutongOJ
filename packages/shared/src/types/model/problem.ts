import { z } from 'zod'
import { isoDatetimeToDate } from '../codec.js'
import { ObjectIdSchema } from '../utils.js'

// TODO: Complete the definition of ProblemModel
export const ProblemModelSchema = z.object({
  pid: z.number(),
  title: z.string(),
  time: z.number(),
  memory: z.number(),
  description: z.string(),
  input: z.string(),
  output: z.string(),
  in: z.string(),
  out: z.string(),
  hint: z.string(),
  status: z.number(),
  type: z.number(),
  code: z.string(),
  tags: z.array(ObjectIdSchema),
  owner: ObjectIdSchema.nullable(),
  submit: z.number(),
  solve: z.number(),
  createdAt: isoDatetimeToDate,
  updatedAt: isoDatetimeToDate,
})

export type ProblemModel = z.infer<typeof ProblemModelSchema>
