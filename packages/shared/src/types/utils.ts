import type { ObjectId } from 'mongodb'
import { z } from 'zod'

/**
 * Transitional MongoDB ObjectId schema. This deliberately avoids importing
 * Mongoose from the cross-runtime shared package while the server still reads
 * legacy MongoDB documents.
 */
export const ObjectIdSchema = z.custom<ObjectId>((val: unknown) => {
  const value = typeof val === 'string'
    ? val
    : (val && typeof val === 'object' && 'toString' in val
        ? String(val)
        : '')
  return /^[0-9a-f]{24}$/i.test(value)
})
