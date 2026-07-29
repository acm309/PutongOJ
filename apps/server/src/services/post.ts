import type { Paginated, PostModel } from '@putongoj/shared'
import type { Types } from 'mongoose'
import type { PaginateOption, SortOption } from '../types'
import type { QueryFilter } from '../types/mongo'
import Post from '../models/Post'

type PostCreateDto = Pick<PostModel, 'title'>

type PostUpdateDto = Partial<Pick<PostModel, 'title' | 'content' | 'slug' | 'publishesAt' | 'isPublished' | 'isPinned' | 'isHidden'>>

async function findPosts (
  options: PaginateOption & SortOption,
  filters: QueryFilter<PostModel> = {},
): Promise<Paginated<Omit<PostModel, 'content'>>> {
  const { page, pageSize, sort, sortBy } = options

  const docsPromise = Post
    .find(filters)
    .sort({
      isPinned: -1,
      [sortBy]: sort,
      ...(sortBy !== 'createdAt' ? { createdAt: -1 } : {}),
    })
    .skip((page - 1) * pageSize)
    .limit(pageSize)
    .select({ content: 0 })
    .lean()

  const totalPromise = Post.countDocuments(filters)
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
  const now = new Date()
  const post = new Post({
    title: data.title,
    content: '',
    publishesAt: now,
  })
  await post.save()
  return post.toObject()
}

async function isSlugTaken (slug: string, excludeId?: Types.ObjectId) {
  const filter: Record<string, any> = { slug }
  if (excludeId) {
    filter._id = { $ne: excludeId }
  }
  const existing = await Post.findOne(filter).select([ '_id' ]).lean()
  return Boolean(existing)
}

async function updatePostById (id: Types.ObjectId, update: PostUpdateDto) {
  return Post.findByIdAndUpdate(
    id,
    { $set: update },
    { returnDocument: 'after' },
  ).lean()
}

async function deletePostById (id: Types.ObjectId): Promise<boolean> {
  const result = await Post.deleteOne({ _id: id })
  return result.deletedCount > 0
}

export const postService = {
  findPosts,
  createPost,
  isSlugTaken,
  updatePostById,
  deletePostById,
} as const
