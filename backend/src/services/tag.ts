import type { TagModel } from '@putongoj/shared'
import type { Types } from 'mongoose'
import { escapeRegExp } from 'lodash'
import Tag from '../models/Tag'

export async function getTags () {
  const tags = await Tag
    .find({}, '-_id tagId name color createdAt updatedAt')
    .sort({ tagId: 1 })
  return tags as TagModel[]
}

export async function getTagObjectIds (
  tagIds: number[],
): Promise<Types.ObjectId[]> {
  const tags = await Tag
    .find({ tagId: { $in: tagIds } }, '_id')
  return tags.map(t => t._id) as Types.ObjectId[]
}

export async function getTag (tagId: number) {
  const tag = await Tag
    .findOne({ tagId })
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

export async function updateTag (tagId: number, opt: Partial<TagModel>) {
  const tag = await Tag
    .findOneAndUpdate({ tagId }, { $set: opt }, { returnDocument: 'after' })
  return tag
}

export async function removeTag (tagId: number): Promise<boolean> {
  const res = await Tag.deleteOne({ tagId })
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
