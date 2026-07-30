import type { DiscussionType, Prisma } from '@putongoj/db'
import type { PaginateOption, SortOption } from '../types'
import { DiscussionType as DiscussionTypeEnum } from '@putongoj/shared'
import { getDatabase } from '../config/postgres'
import { distributeWork } from '../jobs/helper'
import { toCommentDto, toDiscussionDto } from '../persistence/mappers'
import logger from '../utils/logger'

export interface DiscussionQueryFilters {
  authorId?: number
  problemId?: number | null
  contestId?: number | null
  types?: DiscussionType[]
  visibleToUserId?: number | null
}

const discussionInclude = {
  author: { select: { id: true, username: true, nickname: true, avatarUrl: true } },
  problem: { select: { id: true, title: true, ownerId: true } },
  contest: { select: { id: true, title: true, courseId: true } },
  commentStats: true,
} satisfies Prisma.DiscussionInclude

type DiscussionWithRelations = Prisma.DiscussionGetPayload<{
  include: typeof discussionInclude
}>

function buildWhere (filters: DiscussionQueryFilters): Prisma.DiscussionWhereInput {
  const where: Prisma.DiscussionWhereInput = {
    ...(filters.authorId === undefined ? {} : { authorId: filters.authorId }),
    ...(filters.problemId === undefined ? {} : { problemId: filters.problemId }),
    ...(filters.contestId === undefined ? {} : { contestId: filters.contestId }),
    ...(filters.types === undefined ? {} : { type: { in: filters.types } }),
  }
  if (filters.visibleToUserId !== undefined) {
    where.OR = [
      { type: { in: [ DiscussionTypeEnum.OPEN_DISCUSSION, DiscussionTypeEnum.PUBLIC_ANNOUNCEMENT ] } },
      ...(filters.visibleToUserId === null ? [] : [ { authorId: filters.visibleToUserId } ]),
    ]
  }
  return where
}

export async function findDiscussions (options: PaginateOption & SortOption, filters: DiscussionQueryFilters) {
  const database = await getDatabase()
  const where = buildWhere(filters)
  const field = new Set([ 'createdAt', 'updatedAt', 'title' ]).has(options.sortBy) ? options.sortBy : 'createdAt'
  const [ docsRaw, total ] = await Promise.all([
    database.discussion.findMany({
      where,
      include: {
        ...discussionInclude,
      },
      orderBy: [
        { isPinned: 'desc' },
        { [field]: options.sort } as Prisma.DiscussionOrderByWithRelationInput,
        ...(field === 'createdAt'
          ? []
          : [ { createdAt: 'desc' } as Prisma.DiscussionOrderByWithRelationInput ]),
      ],
      skip: (options.page - 1) * options.pageSize,
      take: options.pageSize,
    }),
    database.discussion.count({ where }),
  ])
  return {
    items: docsRaw.map(discussion => toDiscussionView(discussion)),
    page: options.page,
    pageSize: options.pageSize,
    total,
  }
}

export async function getDiscussion (discussionId: number) {
  const database = await getDatabase()
  const discussion = await database.discussion.findUnique({
    where: { id: discussionId },
    include: {
      ...discussionInclude,
    },
  })
  if (!discussion) { return null }
  return toDiscussionView(discussion)
}

function toDiscussionView (discussion: DiscussionWithRelations) {
  return {
    ...toDiscussionDto(discussion, discussion.commentStats),
    author: discussion.author,
    problem: discussion.problem,
    contest: discussion.contest,
  }
}

export async function getComments (
  discussionId: number,
  options: { showHidden?: boolean, exceptUserIds?: number[] } = {},
) {
  const database = await getDatabase()
  const comments = await database.comment.findMany({
    where: {
      discussionId,
      ...(options.showHidden
        ? {}
        : {
            OR: [
              { isHidden: false },
              ...(options.exceptUserIds?.length ? [ { authorId: { in: options.exceptUserIds } } ] : []),
            ],
          }),
    },
    include: { author: { select: { id: true, username: true, nickname: true, avatarUrl: true } } },
    orderBy: { createdAt: 'asc' },
  })
  return comments.map(comment => ({ ...toCommentDto(comment), author: comment.author }))
}

export async function createComment (discussionId: number, authorId: number, content: string) {
  const database = await getDatabase()
  const comment = await database.comment.create({ data: { discussionId, authorId, content } })
  await distributeWork('updateStatistic', `discussion:${discussionId}`)
  return toCommentDto(comment)
}

export async function updateComment (commentId: number, data: Partial<{ isHidden: boolean }>) {
  const database = await getDatabase()
  try {
    const comment = await database.comment.update({ where: { id: commentId }, data })
    await distributeWork('updateStatistic', `discussion:${comment.discussionId}`)
    return toCommentDto(comment)
  } catch (error) {
    logger.warn(`Failed to update comment <Comment:${commentId}>: ${String(error)}`)
    return null
  }
}

export type DiscussionUpdateDto = Partial<{
  authorId: number
  problemId: number | null
  contestId: number | null
  type: DiscussionType
  isPinned: boolean
  title: string
}>

export async function updateDiscussion (discussionId: number, update: DiscussionUpdateDto) {
  const database = await getDatabase()
  try {
    const discussion = await database.discussion.update({
      where: { id: discussionId },
      data: {
        ...(update.authorId === undefined ? {} : { authorId: update.authorId }),
        ...(update.problemId === undefined ? {} : { problemId: update.problemId }),
        ...(update.contestId === undefined ? {} : { contestId: update.contestId }),
        ...(update.isPinned === undefined ? {} : { isPinned: update.isPinned }),
        ...(update.title === undefined ? {} : { title: update.title }),
        ...(update.type === undefined ? {} : { type: update.type }),
      } as any,
    })
    return toDiscussionDto(discussion)
  } catch (error) {
    logger.warn(`Failed to update discussion <Discussion:${discussionId}>: ${String(error)}`)
    return null
  }
}

export async function createDiscussion (data: {
  authorId: number
  problemId: number | null
  contestId: number | null
  type: Exclude<DiscussionType, typeof DiscussionTypeEnum.ARCHIVED_DISCUSSION>
  title: string
  content: string
}) {
  const database = await getDatabase()
  const discussion = await database.$transaction(async (transaction) => {
    const created = await transaction.discussion.create({
      data: {
        authorId: data.authorId,
        problemId: data.problemId,
        contestId: data.contestId,
        type: data.type,
        title: data.title,
      },
    })
    await transaction.comment.create({ data: { discussionId: created.id, authorId: data.authorId, content: data.content } })
    return created
  })
  await distributeWork('updateStatistic', `discussion:${discussion.id}`)
  return toDiscussionDto(discussion)
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
