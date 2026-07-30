import type { TagColor } from '@putongoj/db'
import { getDatabase } from '../config/postgres'
import logger from '../utils/logger'

export async function getTags () {
  const database = await getDatabase()
  const tags = await database.tag.findMany({ orderBy: { id: 'asc' } })
  return tags
}

export async function getTagIds (tagIds: number[]): Promise<number[]> {
  const database = await getDatabase()
  const tags = await database.tag.findMany({
    where: { id: { in: [ ...new Set(tagIds) ] } },
    select: { id: true },
  })
  return tags.map(tag => tag.id)
}

export async function getTag (tagId: number) {
  const database = await getDatabase()
  const tag = await database.tag.findUnique({ where: { id: tagId } })
  return tag
}

export async function findTagIdsByQuery (query: string): Promise<number[]> {
  const database = await getDatabase()
  const tags = await database.tag.findMany({
    where: { name: { contains: query, mode: 'insensitive' } },
    select: { id: true },
  })
  return tags.map(tag => tag.id)
}

export async function createTag (opt: { name: string, color: TagColor }) {
  const database = await getDatabase()
  const tag = await database.tag.create({
    data: {
      name: opt.name,
      color: opt.color,
    },
  })
  return tag
}

export async function updateTag (tagId: number, opt: Partial<{ name: string, color: TagColor }>) {
  const database = await getDatabase()
  try {
    const tag = await database.tag.update({
      where: { id: tagId },
      data: {
        ...(opt.name === undefined ? {} : { name: opt.name }),
        ...(opt.color === undefined ? {} : { color: opt.color }),
      },
    })
    return tag
  } catch (error) {
    logger.warn(`Failed to update tag <Tag:${tagId}>: ${String(error)}`)
    return null
  }
}

export async function removeTag (tagId: number): Promise<boolean> {
  const database = await getDatabase()
  try {
    await database.tag.delete({ where: { id: tagId } })
    return true
  } catch (error) {
    logger.warn(`Failed to remove tag <Tag:${tagId}>: ${String(error)}`)
    return false
  }
}

const tagService = {
  getTags,
  getTagIds,
  getTag,
  findTagIdsByQuery,
  createTag,
  updateTag,
  removeTag,
} as const

export default tagService
