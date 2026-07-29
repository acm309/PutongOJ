import type { Paginated, PostModel } from '@putongoj/shared'
import type { PaginateOption, SortOption } from '../types'
import { randomUUID } from 'node:crypto'
import { getDatabase } from '../config/postgres'

type PostCreateDto = Pick<PostModel, 'title'>

type PostUpdateDto = Partial<Pick<PostModel, 'title' | 'content' | 'slug' | 'publishesAt' | 'isPublished' | 'isPinned' | 'isHidden'>>

export interface PostFilters {
  title?: string
  isPublished?: boolean
  isPinned?: boolean
  isHidden?: boolean
}

async function findPosts (
  options: PaginateOption & SortOption,
  filters: PostFilters = {},
): Promise<Paginated<Omit<PostModel, 'content'>>> {
  const database = await getDatabase()
  const { page, pageSize, sort, sortBy } = options
  const orderBy = [
    { isPinned: 'desc' as const },
    { [sortBy]: sort === 1 ? 'asc' as const : 'desc' as const },
    ...(sortBy === 'createdAt' ? [] : [ { createdAt: 'desc' as const } ]),
  ]
  const where = {
    ...(filters.title
      ? { title: { contains: filters.title, mode: 'insensitive' as const } }
      : {}),
    ...(filters.isPublished === undefined ? {} : { isPublished: filters.isPublished }),
    ...(filters.isPinned === undefined ? {} : { isPinned: filters.isPinned }),
    ...(filters.isHidden === undefined ? {} : { isHidden: filters.isHidden }),
  }

  const docsPromise = database.post.findMany({
    where,
    orderBy,
    skip: (page - 1) * pageSize,
    take: pageSize,
    select: {
      slug: true,
      title: true,
      publishesAt: true,
      isPublished: true,
      isPinned: true,
      isHidden: true,
      createdAt: true,
      updatedAt: true,
    },
  })
  const totalPromise = database.post.count({ where })
  const [ docs, total ] = await Promise.all([ docsPromise, totalPromise ])

  return {
    docs,
    limit: pageSize,
    page,
    pages: Math.ceil(total / pageSize),
    total,
  }
}

async function createPost (data: PostCreateDto) {
  const database = await getDatabase()
  const now = new Date()
  const post = await database.post.create({ data: {
    slug: randomUUID(),
    title: data.title,
    content: '',
    publishesAt: now,
  } })
  return post
}

async function isSlugTaken (slug: string, excludeId?: number) {
  const database = await getDatabase()
  const existing = await database.post.findFirst({
    where: {
      slug,
      ...(excludeId === undefined ? {} : { id: { not: excludeId } }),
    },
    select: { id: true },
  })
  return Boolean(existing)
}

async function updatePostById (id: number, update: PostUpdateDto) {
  const database = await getDatabase()
  try {
    return await database.post.update({ where: { id }, data: update })
  } catch {
    return null
  }
}

async function deletePostById (id: number): Promise<boolean> {
  const database = await getDatabase()
  try {
    await database.post.delete({ where: { id } })
    return true
  } catch {
    return false
  }
}

export const postService = {
  findPosts,
  createPost,
  isSlugTaken,
  updatePostById,
  deletePostById,
} as const
