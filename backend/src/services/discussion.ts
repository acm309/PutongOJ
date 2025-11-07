import type {
  CommentModel,
  ContestModel,
  DiscussionModel,
  DiscussionType,
  Paginated,
  ProblemModel,
  UserModel,
} from '@putongoj/shared'
import type { Types } from 'mongoose'
import type { DocumentId, PaginateOption, SortOption } from '../types'
import type { FilterQuery } from '../types/mongo'
import Comment from '../models/Comment'
import Discussion from '../models/Discussion'

type DiscussionQueryFilters = FilterQuery<{
  author?: Types.ObjectId
  problem?: Types.ObjectId | null
  contest?: Types.ObjectId | null
  type?: DiscussionType
}>

interface DiscussionPopulateConfig {
  author?: (keyof UserModel)[]
  problem?: (keyof ProblemModel)[]
  contest?: (keyof ContestModel)[]
}

type CommentPopulateConfig = Pick<DiscussionPopulateConfig, 'author'>

type DiscussionPopulated<T extends DiscussionPopulateConfig>
  = Omit<DiscussionModel, 'author' | 'problem' | 'contest'> & {
    author: T['author'] extends (keyof UserModel)[]
      ? Pick<UserModel, T['author'][number]> & DocumentId
      : Types.ObjectId
    problem: T['problem'] extends (keyof ProblemModel)[]
      ? Pick<ProblemModel, T['problem'][number]> & DocumentId | null
      : Types.ObjectId | null
    contest: T['contest'] extends (keyof ContestModel)[]
      ? Pick<ContestModel, T['contest'][number]> & DocumentId | null
      : Types.ObjectId | null
  }

type CommentPopulated<T extends CommentPopulateConfig>
  = Omit<CommentModel, 'author'> & {
    author: T['author'] extends (keyof UserModel)[]
      ? Pick<UserModel, T['author'][number]> & DocumentId
      : Types.ObjectId
  }

export async function findDiscussions<
  TFields extends (keyof DiscussionModel)[],
  TPopulate extends DiscussionPopulateConfig,
> (
  options: PaginateOption & SortOption,
  filters: DiscussionQueryFilters,
  fields: TFields,
  populate: TPopulate = {} as TPopulate,
) {
  const { page, pageSize, sort, sortBy } = options
  let query = Discussion
    .find(filters)
    .sort({
      [sortBy]: sort,
      ...(sortBy !== 'createdAt' ? { createdAt: -1 } : {}),
    })
    .select([ '_id', ...fields ])
    .skip((page - 1) * pageSize)
    .limit(pageSize)
  if (populate.author) {
    query = query.populate({ path: 'author', select: populate.author })
  }
  if (populate.problem) {
    query = query.populate({ path: 'problem', select: populate.problem })
  }
  if (populate.contest) {
    query = query.populate({ path: 'contest', select: populate.contest })
  }

  const docsPromise = query.lean()
  const countPromise = Discussion.countDocuments(filters)

  const [ docs, total ] = await Promise.all([ docsPromise, countPromise ])
  const result: Paginated<Pick<DiscussionPopulated<TPopulate>, TFields[number]> & DocumentId> = {
    docs: docs as any,
    limit: pageSize,
    page,
    pages: Math.ceil(total / pageSize),
    total,
  }
  return result
}

async function getDiscussionPopulated<TPopulate extends DiscussionPopulateConfig> (
  discussionId: number, populate: TPopulate,
) {
  let query = Discussion.findOne({ discussionId })
  if (populate.author) {
    query = query.populate({ path: 'author', select: populate.author })
  }
  if (populate.problem) {
    query = query.populate({ path: 'problem', select: populate.problem })
  }
  if (populate.contest) {
    query = query.populate({ path: 'contest', select: populate.contest })
  }
  const doc = await query.lean()
  return doc as (DiscussionPopulated<TPopulate> & DocumentId) | null
}

export async function getDiscussion (discussionId: number) {
  return getDiscussionPopulated(discussionId, {
    author: [ 'uid' ],
    problem: [ 'pid', 'owner' ],
    contest: [ 'cid' ],
  })
}

export type DiscussionDocument = Awaited<ReturnType<typeof getDiscussion>>

async function getCommentsPopulated<TPopulate extends CommentPopulateConfig> (
  discussion: Types.ObjectId, populate: TPopulate,
) {
  let query = Comment.find({ discussion }).sort({ createdAt: 1 })
  if (populate.author) {
    query = query.populate({ path: 'author', select: populate.author })
  }
  const docs = await query.lean() as unknown[]
  return docs as (CommentPopulated<TPopulate> & DocumentId)[]
}

export async function getComments (discussion: Types.ObjectId) {
  return getCommentsPopulated(discussion, {
    author: [ 'uid', 'nick' ],
  })
}

// interface DiscussionCreateDto {
//   user: ObjectId
//   problem: ObjectId | null
//   contest: ObjectId | null
//   title: string
//   content: string
// }

// interface DiscussionCommentCreateDto {
//   user: ObjectId
//   content: string
// }

// export async function createDiscussion(data: DiscussionCreateDto): Promise<DiscussionModel> { return {} as any }
// export async function deleteDiscussion(discussionId: number): Promise<void> { return {} as any }
// export async function addComment(discussion: ObjectId, comment: DiscussionCommentCreateDto): Promise<DiscussionModel> { return {} as any }

const discussionService = {
  findDiscussions,
  getDiscussion,
  getComments,
} as const

export default discussionService
