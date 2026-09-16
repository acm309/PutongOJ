import type { Document, Model, Schema } from 'mongoose'
import capitalize from 'lodash/capitalize.js'
import mongoose from '../client.js'

const idFields = [
  'Comment',
  'Contest',
  'Course',
  'Discussion',
  'Group',
  'Problem',
  'Solution',
  'Tag',
]

type IdDocument = {
  name: string
  id: number
} & Document

type IdModel = {
  generateId: (field: string) => Promise<number>
} & Model<IdDocument>

const idSchema: Schema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    enum: idFields,
    index: {
      unique: true,
    },
  },
  id: {
    type: Number,
    default: 0,
  },
}, {
  collection: 'ids',
})

idSchema.statics.generateId = async function (field: string): Promise<number> {
  if (!idFields.includes(field)) {
    throw new Error(
      `Invalid field: ${field}. `
      + `Must be one of: ${idFields.join(', ')}`,
    )
  }

  const result = await this
    .findOneAndUpdate(
      { name: capitalize(field) },
      { $inc: { id: 1 } },
      { returnDocument: 'after', upsert: true },
    )
    .exec()

  if (!result) {
    throw new Error(`Failed to generate ID for field: ${field}`)
  }

  return result.id
}

const ID
  = mongoose.model<IdDocument, IdModel>(
    'ids',
    idSchema,
  )

export default ID
