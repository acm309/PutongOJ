import type {
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
import Discussion from '../models/Discussion'

type DiscussionQueryFilters = FilterQuery<{
  owner?: Types.ObjectId
  problem?: Types.ObjectId | null
  contest?: Types.ObjectId | null
  type?: DiscussionType
}>

interface DiscussionPopulateConfig {
  owner?: (keyof UserModel)[]
  problem?: (keyof ProblemModel)[]
  contest?: (keyof ContestModel)[]
  user?: (keyof UserModel)[]
}

type DiscussionPopulated<T extends DiscussionPopulateConfig>
  = Omit<DiscussionModel, 'owner' | 'problem' | 'contest' | 'comments'> & {
    owner: T['owner'] extends (keyof UserModel)[]
      ? Pick<UserModel, T['owner'][number]> & DocumentId
      : Types.ObjectId
    problem: T['problem'] extends (keyof ProblemModel)[]
      ? Pick<ProblemModel, T['problem'][number]> & DocumentId | null
      : Types.ObjectId | null
    contest: T['contest'] extends (keyof ContestModel)[]
      ? Pick<ContestModel, T['contest'][number]> & DocumentId | null
      : Types.ObjectId | null
    comments: (Omit<DiscussionModel['comments'][number], 'user'> & {
      user: T['user'] extends (keyof UserModel)[]
        ? Pick<UserModel, T['user'][number]> & DocumentId
        : Types.ObjectId
    })[]
  }

function applyPopulate<TPopulate extends DiscussionPopulateConfig> (
  query: ReturnType<typeof Discussion.find> | ReturnType<typeof Discussion.findOne>,
  populate: TPopulate,
) {
  if (populate.owner) {
    query = query.populate({ path: 'owner', select: populate.owner })
  }
  if (populate.problem) {
    query = query.populate({ path: 'problem', select: populate.problem })
  }
  if (populate.contest) {
    query = query.populate({ path: 'contest', select: populate.contest })
  }
  if (populate.user) {
    query = query.populate({ path: 'comments.user', select: populate.user })
  }
  return query
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
  const query = Discussion
    .find(filters)
    .sort({
      [sortBy]: sort,
      ...(sortBy !== 'createdAt' ? { createdAt: -1 } : {}),
    })
    .select([ '_id', ...fields ])
    .skip((page - 1) * pageSize)
    .limit(pageSize)

  const docsPromise = applyPopulate(query, populate).lean()
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
  const query = Discussion.findOne({ discussionId })
  const doc = await applyPopulate(query, populate).lean() as any
  return doc as (DiscussionPopulated<TPopulate> & DocumentId) | null
}

export async function getDiscussion (discussionId: number) {
  return getDiscussionPopulated(discussionId, {
    owner: [ 'uid' ],
    problem: [ 'pid', 'owner' ],
    contest: [ 'cid' ],
    user: [ 'uid', 'nick' ],
  })
}

export type DiscussionDocument = Awaited<ReturnType<typeof getDiscussion>>

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
} as const

export default discussionService
