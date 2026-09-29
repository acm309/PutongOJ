import type { Types } from '@putong-oj/db'
import type {
  CommentModel,
  ContestModel,
  DiscussionModel,
  DiscussionType,
  Paginated,
  ProblemModel,
  UserModel,
  WithId,
} from '@putong-oj/shared'
import type { PaginateOption, SortOption } from '../types/index.ts'
import type { QueryFilter } from '../types/mongo.ts'
import { Comment, Discussion } from '@putong-oj/db'
import { distributeWork } from './taskQueue.ts'

export type DiscussionQueryFilters = QueryFilter<{
  author: Types.ObjectId
  problem: Types.ObjectId | null
  contest: Types.ObjectId | null
  type: DiscussionType
}>

interface DiscussionPopulateConfig {
  author?: (keyof UserModel)[]
  problem?: (keyof ProblemModel)[]
  contest?: (keyof ContestModel)[]
}

type DiscussionPopulated<T extends DiscussionPopulateConfig>
  = Omit<DiscussionModel, 'author' | 'problem' | 'contest'> & {
    author: T['author'] extends (keyof UserModel)[]
      ? WithId<Pick<UserModel, T['author'][number]>>
      : Types.ObjectId
    problem: T['problem'] extends (keyof ProblemModel)[]
      ? WithId<Pick<ProblemModel, T['problem'][number]>> | null
      : Types.ObjectId | null
    contest: T['contest'] extends (keyof ContestModel)[]
      ? WithId<Pick<ContestModel, T['contest'][number]>> | null
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
    .find(filters)
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
  const countPromise = Discussion.countDocuments(filters)

  const [ docs, total ] = await Promise.all([ docsPromise, countPromise ])
  const result: Paginated<WithId<Pick<DiscussionPopulated<TPopulate>, TFields[number]>>> = {
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
  return doc as WithId<DiscussionPopulated<TPopulate>> | null
}

export async function getDiscussion (discussionId: number) {
  return getDiscussionPopulated(discussionId, {
    author: [ 'uid' ],
    problem: [ 'pid', 'owner' ],
    contest: [ 'contestId' ],
  })
}

export type DiscussionDocument = NonNullable<Awaited<ReturnType<typeof getDiscussion>>>

type CommentPopulateConfig = Pick<DiscussionPopulateConfig, 'author'>

type CommentPopulated<T extends CommentPopulateConfig>
  = Omit<CommentModel, 'author'> & {
    author: T['author'] extends (keyof UserModel)[]
      ? WithId<Pick<UserModel, T['author'][number]>>
      : Types.ObjectId
  }

type CommentPopulatedDocument<T extends CommentPopulateConfig> = WithId<CommentPopulated<T>>

async function getCommentsPopulated<TPopulate extends CommentPopulateConfig> (
  discussion: Types.ObjectId, populate: TPopulate,
  options: { showHidden?: boolean, exceptUsers?: Types.ObjectId[] } = {},
) {
  const filters: QueryFilter<CommentModel>[] = [ { discussion } ]
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
  const docs = await query
  return docs.map(comment => comment.toObject<CommentPopulatedDocument<TPopulate>>({ virtuals: true }))
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
  return newComment.toObject({ virtuals: true })
}

export async function updateComment (
  commentId: string,
  update: Partial<Pick<CommentModel, 'hidden'>>,
): Promise<CommentModel | null> {
  const comment = await Comment.findByIdAndUpdate(
    commentId, { $set: update }, { returnDocument: 'after' },
  )
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
    { discussionId }, update, { returnDocument: 'after' },
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
