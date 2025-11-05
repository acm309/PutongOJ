import { z } from 'zod'
import { isoDatetimeToDate } from '../codec.js'
import { ObjectIdSchema } from '../utils.js'

// TODO: Complete the definition of ContestModel
export const ContestModelSchema = z.object({
  cid: z.number(),
  title: z.string(),
  start: z.number(),
  end: z.number(),
  list: z.array(z.number()),
  status: z.number(),
  encrypt: z.number(),
  argument: z.string(),
  option: z.object({
    labelingStyle: z.number(),
  }).partial(),
  course: ObjectIdSchema.nullable(),
  createdAt: isoDatetimeToDate,
  updatedAt: isoDatetimeToDate,
})

export type ContestModel = z.infer<typeof ContestModelSchema>
