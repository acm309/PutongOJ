import type { Document, Model, Schema } from 'mongoose'
import { capitalize } from 'lodash'
import mongoose from 'mongoose'

const idFields = [
  'Contest', 'Course', 'Discuss', 'Group', 'News', 'Problem', 'Solution', 'Tag',
]

interface IdDocument extends Document {
  name: string
  id: number
}

interface IdModel extends Model<IdDocument> {
  generateId: (field: string) => Promise<number>
}

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
      { new: true, upsert: true },
    )
    .exec()

  if (!result) {
    throw new Error(`Failed to generate ID for field: ${field}`)
  }

  return result.id
}

export default module.exports
  = mongoose.model<IdDocument, IdModel>('ids', idSchema)
