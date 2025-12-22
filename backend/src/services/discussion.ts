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
import { distributeWork } from '../jobs/helper'
import Comment from '../models/Comment'
import Discussion from '../models/Discussion'

export type DiscussionQueryFilters = FilterQuery<{
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
    .find(filters as any)
    .sort({
      pinned: -1,
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
  const countPromise = Discussion.countDocuments(filters as any)

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

type CommentPopulateConfig = Pick<DiscussionPopulateConfig, 'author'>

type CommentPopulated<T extends CommentPopulateConfig>
  = Omit<CommentModel, 'author'> & {
    author: T['author'] extends (keyof UserModel)[]
      ? Pick<UserModel, T['author'][number]> & DocumentId
      : Types.ObjectId
  }

async function getCommentsPopulated<TPopulate extends CommentPopulateConfig> (
  discussion: Types.ObjectId, populate: TPopulate,
  options: { showHidden?: boolean, exceptUsers?: Types.ObjectId[] } = {},
) {
  const filters: FilterQuery<CommentModel>[] = [ { discussion } ]
  if (!options.showHidden) {
    filters.push({
      $or: [
        { hidden: false },
        { hidden: { $exists: false } },
        { author: { $in: options.exceptUsers ?? [] } },
      ],
    })
  }

  let query = Comment.find({ $and: filters }).sort({ createdAt: 1 })
  if (populate.author) {
    query = query.populate({ path: 'author', select: populate.author })
  }
  const docs = await query.lean() as unknown[]
  return docs as (CommentPopulated<TPopulate> & DocumentId)[]
}

export async function getComments (
  discussion: Types.ObjectId, options: { showHidden?: boolean, exceptUsers?: Types.ObjectId[] } = {},
) {
  return getCommentsPopulated(discussion, {
    author: [ 'uid', 'nick', 'avatar' ],
  }, options)
}

export async function createComment (
  discussion: Types.ObjectId,
  comment: Pick<CommentModel, 'author' | 'content'>,
): Promise<CommentModel> {
  const { author, content } = comment
  const newComment = new Comment({ discussion, author, content })
  await newComment.save()
  await distributeWork('updateStatistic', `discussion:${discussion.toString()}`)
  return newComment.toObject()
}

export async function updateComment (
  commentId: number,
  update: Partial<Pick<CommentModel, 'hidden'>>,
): Promise<CommentModel | null> {
  const comment = await Comment.findOneAndUpdate(
    { commentId }, update, { new: true },
  ).lean()
  return comment
}

export type DiscussionUpdateDto = Partial<Pick<DiscussionModel,
  'author' | 'problem' | 'contest' | 'type' | 'pinned' | 'title'
>>

export async function updateDiscussion (
  discussionId: number,
  update: DiscussionUpdateDto,
): Promise<DiscussionModel | null> {
  const discussion = await Discussion.findOneAndUpdate(
    { discussionId }, update, { new: true },
  ).lean()
  return discussion
}

type DiscussionCreateDto = Pick<DiscussionModel,
  'author' | 'problem' | 'contest' | 'type' | 'title'
> & Pick<CommentModel, 'content'>

export async function createDiscussion (
  discussion: DiscussionCreateDto,
): Promise<DiscussionModel> {
  const { author, problem, contest, type, title, content } = discussion
  const newDiscussion = new Discussion({
    author, problem, contest, type, title,
  })
  await newDiscussion.save()
  await createComment(newDiscussion._id, { author, content })
  return newDiscussion.toObject()
}

const discussionService = {
  findDiscussions,
  createDiscussion,
  getDiscussion,
  updateDiscussion,
  getComments,
  createComment,
  updateComment,
} as const

export default discussionService
