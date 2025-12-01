import type { Types } from 'mongoose'
import { z } from 'zod'

export const ObjectIdSchema = z.custom<Types.ObjectId>(async (val: any) => {
  let strval: string = ''
  if (typeof val === 'string') {
    strval = val
  }
  else if (val && typeof val === 'object' && 'toString' in val) {
    strval = val.toString()
  }
  return /^[0-9a-f]{24}$/i.test(strval)
})
