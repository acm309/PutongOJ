import { Types } from 'mongoose'
import { z } from 'zod'

export const ObjectIdSchema = z.custom<Types.ObjectId>((val: any) => {
  return Types.ObjectId.isValid(val)
})
