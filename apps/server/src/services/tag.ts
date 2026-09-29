import type { Types } from '@putong-oj/db'
import type { TagModel } from '@putong-oj/shared'
import { Tag } from '@putong-oj/db'
import escapeRegExp from 'lodash/escapeRegExp.js'

export async function getTags () {
  const tags = await Tag
    .find({})
    .sort({ _id: 1 })
    .lean()
  return tags.map(tag => ({
    id: tag._id.toString(),
    name: tag.name,
    color: tag.color,
    createdAt: tag.createdAt,
    updatedAt: tag.updatedAt,
  }))
}

export async function getTagObjectIds (
  tagIds: string[],
): Promise<Types.ObjectId[]> {
  const tags = await Tag
    .find({ _id: { $in: tagIds } }, '_id')
  return tags.map(t => t._id)
}

export async function getTag (id: string) {
  const tag = await Tag
    .findById(id)
    .lean()
  return tag
}

export async function findTagObjectIdsByQuery (
  query: string,
): Promise<Types.ObjectId[]> {
  const tags = await Tag
    .find({ name: { $regex: escapeRegExp(query), $options: 'i' } }, '_id')
  return tags.map(t => t._id) as Types.ObjectId[]
}

export async function createTag (opt: Partial<TagModel>) {
  const tag = new Tag(opt)
  await tag.save()
  return tag
}

export async function updateTag (id: string, opt: Partial<TagModel>) {
  const tag = await Tag
    .findByIdAndUpdate(id, { $set: opt }, { returnDocument: 'after' })
  return tag !== null
}

export async function removeTag (id: string): Promise<boolean> {
  const res = await Tag.deleteOne({ _id: id })
  return res.deletedCount === 1
}

const tagService = {
  getTags,
  getTagObjectIds,
  getTag,
  findTagObjectIdsByQuery,
  createTag,
  updateTag,
  removeTag,
} as const

export default tagService
