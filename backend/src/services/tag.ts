import type { ObjectId } from 'mongoose'
import type { TagDocument } from '../models/Tag'
import type { TagEntity, TagEntityForm, TagEntityItem, TagEntityPreview } from '../types/entity'
import { escapeRegExp } from 'lodash'
import Tag from '../models/Tag'

export const toItem = Tag.toItem
export const toPreview = Tag.toPreview
export const toView = Tag.toView

export async function getTags (): Promise<TagEntityPreview[]> {
  const tags = await Tag
    .find({}, '-_id tagId name color createdAt updatedAt')
    .sort({ tagId: 1 })
  return tags.map(toPreview) as TagEntityPreview[]
}

export async function getTagItems (): Promise<TagEntityItem[]> {
  const tags = await Tag
    .find({}, '-_id tagId name color')
    .sort({ tagId: 1 })
  return tags.map(toItem) as TagEntityItem[]
}

export async function getTagObjectIds (
  tagIds: number[],
): Promise<ObjectId[]> {
  const tags = await Tag
    .find({ tagId: { $in: tagIds } }, '_id')
  return tags.map(t => t._id) as ObjectId[]
}

export async function getTag (
  tagId: number,
): Promise<TagDocument | null> {
  const tag = await Tag.findOne({ tagId })
  return tag as TagDocument | null
}

export async function findTagObjectIdsByQuery (
  query: string,
): Promise<ObjectId[]> {
  const tags = await Tag
    .find({ name: { $regex: escapeRegExp(query), $options: 'i' } }, '_id')
  return tags.map(t => t._id) as ObjectId[]
}

export async function createTag (
  opt: Partial<TagEntityForm>,
): Promise<TagDocument> {
  const tag = new Tag(opt)
  await tag.save()
  return tag as TagDocument
}

export async function updateTag (
  tagId: number,
  opt: Partial<TagEntity>,
): Promise<TagDocument | null> {
  const tag = await Tag
    .findOneAndUpdate({ tagId }, { $set: opt }, { new: true })
  return tag as TagDocument | null
}

export async function removeTag (
  tagId: number,
): Promise<boolean> {
  const res = await Tag.deleteOne({ tagId })
  return res.deletedCount === 1
}

const tagService = {
  toItem,
  toPreview,
  toView,
  getTags,
  getTagItems,
  getTagObjectIds,
  getTag,
  findTagObjectIdsByQuery,
  createTag,
  updateTag,
  removeTag,
} as const

export default tagService
