import type { Prisma, ProblemJudgeType, ProblemVisibility, TagColor } from '@putongoj/db'
import type { PaginatedResult, ProblemStatisticsQueryResult } from '@putongoj/shared'
import type { PaginateOption } from '../types'
import path from 'node:path'
import { JUDGE_STATUS_TERMINAL, JudgeStatus, ProblemVisibility as ProblemVisibilityEnum } from '@putongoj/shared'
import fse from 'fs-extra'
import { getDatabase } from '../config/postgres'
import logger from '../utils/logger'
import { CacheKey, cacheService } from './cache'
import tagService from './tag'

export interface ProblemListItem {
  id: number
  title: string
  timeLimitMs: number
  memoryLimitKb: number
  visibility: ProblemVisibility
  judgeType: ProblemJudgeType
  ownerId: number | null
  submitterCount: number
  solverCount: number
  tags: Array<{ id: number, name: string, color: TagColor }>
}

type ProblemSearchType = 'title' | 'tag' | 'id'

function buildProblemSearchWhere (opt: {
  type?: ProblemSearchType
  content?: string
  showReserved?: boolean
  ownerId?: number | null
}): Prisma.ProblemWhereInput {
  const clauses: Prisma.ProblemWhereInput[] = []
  if (!opt.showReserved) {
    clauses.push({
      OR: [
        { visibility: ProblemVisibilityEnum.AVAILABLE },
        ...(opt.ownerId === undefined || opt.ownerId === null ? [] : [ { ownerId: opt.ownerId } ]),
      ],
    })
  }
  if (opt.content) {
    switch (opt.type) {
      case 'title':
        clauses.push({ title: { contains: opt.content, mode: 'insensitive' } })
        break
      case 'tag':
        clauses.push({ tags: { some: { tag: { name: { contains: opt.content, mode: 'insensitive' } } } } })
        break
      case 'id': {
        const prefix = Number(opt.content)
        if (Number.isInteger(prefix)) {
          clauses.push({ id: { gte: prefix, lt: prefix + 1 } })
        }
        break
      }
    }
  }
  return clauses.length === 0 ? {} : { AND: clauses }
}

function toListItem (problem: {
  id: number
  title: string
  timeLimitMs: number
  memoryLimitKb: number
  visibility: string
  judgeType: string
  ownerId: number | null
  tags: Array<{ tag: { id: number, name: string, color: TagColor } }>
  submissionStats: { submitterCount: number, solverCount: number } | null
}): ProblemListItem {
  return {
    id: problem.id,
    title: problem.title,
    timeLimitMs: problem.timeLimitMs,
    memoryLimitKb: problem.memoryLimitKb,
    visibility: problem.visibility as ProblemVisibility,
    judgeType: problem.judgeType as ProblemJudgeType,
    ownerId: problem.ownerId,
    submitterCount: problem.submissionStats?.submitterCount ?? 0,
    solverCount: problem.submissionStats?.solverCount ?? 0,
    tags: problem.tags.map(({ tag }) => ({ id: tag.id, name: tag.name, color: tag.color })),
  }
}

export async function findProblems (
  opt: PaginateOption & {
    type?: ProblemSearchType
    content?: string
    showReserved?: boolean
    ownerId?: number | null
  },
): Promise<PaginatedResult<ProblemListItem>> {
  const database = await getDatabase()
  const where = buildProblemSearchWhere(opt)
  const [ items, total ] = await Promise.all([
    database.problem.findMany({
      where,
      include: { tags: { include: { tag: true } }, submissionStats: true },
      orderBy: { id: 'asc' },
      skip: (opt.page - 1) * opt.pageSize,
      take: opt.pageSize,
    }),
    database.problem.count({ where }),
  ])
  return {
    items: items.map(toListItem),
    page: opt.page,
    pageSize: opt.pageSize,
    total,
  }
}

export async function findProblemItems (keyword: string, limit: number = 10) {
  const database = await getDatabase()
  const numericId = Number(keyword)
  const problems = await database.problem.findMany({
    where: {
      OR: [
        { title: { contains: keyword, mode: 'insensitive' } },
        ...(Number.isInteger(numericId) ? [ { id: { gte: numericId, lt: numericId + 1 } } ] : []),
      ],
    },
    select: { id: true, title: true },
    orderBy: [ { updatedAt: 'desc' }, { id: 'asc' } ],
    take: limit,
  })
  return problems
}

export async function getProblemItems () {
  const database = await getDatabase()
  return await database.problem.findMany({ select: { id: true, title: true }, orderBy: { id: 'asc' } })
}

export async function getProblem (problemId: number) {
  const database = await getDatabase()
  return await database.problem.findUnique({
    where: { id: problemId },
    include: {
      tags: { include: { tag: true } },
      owner: { select: { id: true, username: true, nickname: true, privilege: true } },
      submissionStats: true,
    },
  })
}

export async function createProblem (data: {
  title: string
  timeLimitMs?: number
  memoryLimitKb?: number
  description?: string
  inputFormat?: string
  outputFormat?: string
  sampleInput?: string
  sampleOutput?: string
  hint?: string
  visibility?: ProblemVisibility
  judgeType?: ProblemJudgeType
  judgeCode?: string
  ownerId?: number | null
  tagIds?: number[]
}) {
  const database = await getDatabase()
  const tagIds = [ ...new Set(data.tagIds ?? []) ]
  const problem = await database.problem.create({
    data: {
      title: data.title,
      timeLimitMs: data.timeLimitMs,
      memoryLimitKb: data.memoryLimitKb,
      description: data.description,
      inputFormat: data.inputFormat,
      outputFormat: data.outputFormat,
      sampleInput: data.sampleInput,
      sampleOutput: data.sampleOutput,
      hint: data.hint,
      visibility: data.visibility,
      judgeType: data.judgeType,
      judgeCode: data.judgeCode,
      ownerId: data.ownerId ?? null,
      ...(tagIds.length === 0 ? {} : { tags: { createMany: { data: tagIds.map(tagId => ({ tagId })) } } }),
    },
  })
  const directory = path.resolve(__dirname, '../../data', String(problem.id))
  await fse.ensureDir(directory)
  await fse.outputJson(path.resolve(directory, 'meta.json'), { testcases: [] }, { spaces: 2 })
  return problem
}

export async function updateProblem (problemId: number, data: Partial<{
  title: string
  timeLimitMs: number
  memoryLimitKb: number
  description: string
  inputFormat: string
  outputFormat: string
  sampleInput: string
  sampleOutput: string
  hint: string
  visibility: ProblemVisibility
  judgeType: ProblemJudgeType
  judgeCode: string
  ownerId: number | null
  tagIds: number[]
}>) {
  const database = await getDatabase()
  try {
    return await database.$transaction(async (transaction) => {
      const { tagIds, ...problemData } = data
      if (tagIds !== undefined) {
        await transaction.problemTag.deleteMany({ where: { problemId } })
        if (tagIds.length > 0) {
          await transaction.problemTag.createMany({
            data: [ ...new Set(tagIds) ].map(tagId => ({ problemId, tagId })),
          })
        }
      }
      return await transaction.problem.update({ where: { id: problemId }, data: problemData })
    })
  } catch (error) {
    logger.warn(`Failed to update problem <Problem:${problemId}>: ${String(error)}`)
    return null
  }
}

export async function removeProblem (problemId: number): Promise<boolean> {
  const database = await getDatabase()
  try {
    await database.problem.delete({ where: { id: problemId } })
    return true
  } catch (error) {
    logger.warn(`Failed to remove problem <Problem:${problemId}>: ${String(error)}`)
    return false
  }
}

function buildDistributionBuckets (values: Array<{ value: number, count: number }>, bucketCount: number) {
  if (values.length === 0) { return [] }
  const min = values[0]!.value
  const max = values.at(-1)!.value
  const width = Math.max(1, Math.ceil((max - min + 1) / bucketCount))
  const buckets = Array.from({ length: bucketCount }, (_, index) => ({
    lowerBound: min + (index * width),
    upperBound: min + ((index + 1) * width) - 1,
    count: 0,
  }))
  for (const value of values) {
    buckets[Math.min(Math.floor((value.value - min) / width), bucketCount - 1)]!.count += value.count
  }
  return buckets
}

export async function getStatistics (problemId: number): Promise<ProblemStatisticsQueryResult> {
  return await cacheService.getOrCreate(CacheKey.problemStatistics(problemId), async () => {
    const database = await getDatabase()
    const terminalStatuses = [ ...JUDGE_STATUS_TERMINAL ] as Array<typeof JUDGE_STATUS_TERMINAL[number]>
    const [ judgeCounts, accepted ] = await Promise.all([
      database.submission.groupBy({
        by: [ 'status' ],
        where: { problemId, status: { in: terminalStatuses } },
        _count: { _all: true },
        orderBy: { status: 'asc' },
      }),
      database.submission.findMany({
        where: { problemId, status: JudgeStatus.ACCEPTED },
        select: { timeUsedMs: true, memoryUsedKb: true },
      }),
    ])
    const timeCounts = new Map<number, number>()
    const memoryCounts = new Map<number, number>()
    for (const submission of accepted) {
      timeCounts.set(submission.timeUsedMs, (timeCounts.get(submission.timeUsedMs) ?? 0) + 1)
      memoryCounts.set(submission.memoryUsedKb, (memoryCounts.get(submission.memoryUsedKb) ?? 0) + 1)
    }
    const judgeStatusCounts = judgeCounts.map(row => ({
      status: row.status as typeof JUDGE_STATUS_TERMINAL[number],
      count: row._count._all,
    }))
    const timeValues = [ ...timeCounts ]
      .map(([ value, count ]) => ({ value, count }))
      .sort((first, second) => first.value - second.value)
    const memoryValues = [ ...memoryCounts ]
      .map(([ value, count ]) => ({ value, count }))
      .sort((first, second) => first.value - second.value)

    return {
      judgeCounts: judgeStatusCounts,
      timeDistribution: buildDistributionBuckets(timeValues, 20),
      memoryDistribution: buildDistributionBuckets(memoryValues, 20),
    }
  }, { redisTtl: 30 })
}

export async function findCourseProblems (courseId: number, opt: PaginateOption & { type?: ProblemSearchType, content?: string }) {
  const database = await getDatabase()
  const problemWhere = buildProblemSearchWhere({ type: opt.type, content: opt.content, showReserved: true })
  const where = { courseId, problem: problemWhere }
  const [ items, total ] = await Promise.all([
    database.courseProblem.findMany({
      where,
      include: { problem: { include: { tags: { include: { tag: true } }, submissionStats: true } } },
      orderBy: [ { sort: 'asc' }, { updatedAt: 'desc' } ],
      skip: (opt.page - 1) * opt.pageSize,
      take: opt.pageSize,
    }),
    database.courseProblem.count({ where }),
  ])
  return {
    items: items.map(({ problem }) => toListItem(problem)),
    page: opt.page,
    pageSize: opt.pageSize,
    total,
  }
}

export async function findCourseProblemItems (courseId: number, keyword: string, limit: number = 10) {
  const database = await getDatabase()
  const numericId = Number(keyword)
  const rows = await database.courseProblem.findMany({
    where: {
      courseId,
      problem: {
        OR: [
          { title: { contains: keyword, mode: 'insensitive' } },
          ...(Number.isInteger(numericId) ? [ { id: { gte: numericId, lt: numericId + 1 } } ] : []),
        ],
      },
    },
    include: { problem: { select: { id: true, title: true } } },
    orderBy: [ { sort: 'asc' }, { updatedAt: 'desc' } ],
    take: limit,
  })
  return rows.map(({ problem }) => problem)
}

const problemService = {
  findProblems,
  findProblemItems,
  getProblemItems,
  getProblem,
  createProblem,
  updateProblem,
  removeProblem,
  getStatistics,
  findCourseProblems,
  findCourseProblemItems,
  getTagIds: tagService.getTagIds,
} as const

export default problemService
