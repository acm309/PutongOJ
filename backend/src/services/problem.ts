import type { Paginated, ProblemStatisticsQueryResult } from '@putongoj/shared'
import type { PipelineStage } from 'mongoose'
import type { ProblemDocument, ProblemDocumentPopulated } from '../models/Problem'
import type { PaginateOption } from '../types'
import type { ProblemEntity, ProblemEntityForm, ProblemEntityItem, ProblemEntityPreview } from '../types/entity'
import path from 'node:path'
import { JUDGE_STATUS_TERMINAL, JudgeStatus } from '@putongoj/shared'
import fse from 'fs-extra'
import { escapeRegExp } from 'lodash'
import mongoose, { Types } from 'mongoose'
import CourseProblem from '../models/CourseProblem'
import Problem from '../models/Problem'
import Solution from '../models/Solution'
import { status } from '../utils/constants'
import { CacheKey, cacheService } from './cache'
import tagService from './tag'

export async function findProblems (
  opt: PaginateOption & {
    type?: string
    content?: string
    showReserved?: boolean
    includeOwner?: Types.ObjectId | string | null
  },
): Promise<Paginated<ProblemEntityPreview & { owner: Types.ObjectId | null }>> {
  const { page, pageSize, content, type, showReserved, includeOwner } = opt
  const filters: Record<string, any>[] = []

  if (!(showReserved === true)) {
    const statusFilters: Record<string, any>[]
      = [ { status: status.Available } ]
    if (includeOwner) {
      statusFilters.push({
        owner: new Types.ObjectId(includeOwner.toString()),
      })
    }
    filters.push({ $or: statusFilters })
  }
  if (content) {
    switch (type) {
      case 'title':
        filters.push({
          title: { $regex: new RegExp(escapeRegExp(String(content)), 'i') },
        })
        break
      case 'tag':
        filters.push({
          tags: { $in: await tagService.findTagObjectIdsByQuery(String(content)) },
        })
        break
      case 'pid':
        filters.push({
          $expr: {
            $regexMatch: {
              input: { $toString: '$pid' },
              regex: new RegExp(`^${escapeRegExp(String(content))}`, 'i'),
            },
          },
        })
        break
    }
  }

  const result = await Problem.paginate({ $and: filters }, {
    sort: { pid: 1 },
    page,
    populate: { path: 'tags', select: '-_id tagId name color' },
    limit: pageSize,
    lean: true,
    leanWithId: false,
    select: '-_id pid title status type tags submit solve owner',
  }) as unknown as Paginated<ProblemEntityPreview & { owner: Types.ObjectId | null }>
  return result
}

export async function findProblemItems (
  keyword: string,
  limit: number = 10,
): Promise<ProblemEntityItem[]> {
  const result: ProblemEntityItem[] = []
  if (Number.isInteger(Number(keyword))) {
    result.push(...await Problem.find(
      {
        $expr: {
          $regexMatch: {
            input: { $toString: '$pid' },
            regex: new RegExp(`^${escapeRegExp(keyword)}`, 'i'),
          },
        },
      },
      { _id: 0, pid: 1, title: 1 },
      { sort: { pid: 1 }, limit },
    ).lean(),
    )
  }
  if (result.length < limit) {
    result.push(...await Problem.find(
      {
        pid: { $nin: result.map(p => p.pid) },
        title: { $regex: new RegExp(escapeRegExp(keyword), 'i') },
      },
      { _id: 0, pid: 1, title: 1 },
      { sort: { updatedAt: -1 }, limit: limit - result.length },
    ).lean(),
    )
  }
  return result
}

export async function getProblemItems (): Promise<ProblemEntityItem[]> {
  const result = await Problem
    .find({}, { _id: 0, title: 1, pid: 1 })
    .lean()
  return result
}

export async function getProblem (
  pid: number,
): Promise<ProblemDocumentPopulated | undefined> {
  const problem = await Problem
    .findOne({ pid })
    .populate('tags')
  return (problem ?? undefined) as ProblemDocumentPopulated | undefined
}

export async function createProblem (
  opt: ProblemEntityForm,
): Promise<ProblemDocument> {
  const problem = new Problem(opt)
  await problem.save()

  const dir = path.resolve(__dirname, '../../data', String(problem.pid))
  await fse.ensureDir(dir)
  await fse.outputJson(
    path.resolve(dir, 'meta.json'),
    { testcases: [] },
    { spaces: 2 })

  return problem
}

export async function updateProblem (
  pid: number,
  opt: Partial<ProblemEntity>,
): Promise<ProblemDocument | undefined> {
  const problem = await Problem
    .findOneAndUpdate({ pid }, { $set: opt }, { returnDocument: 'after' })
  return problem ?? undefined
}

export async function removeProblem (pid: number): Promise<boolean> {
  const problem = await Problem.deleteOne({ pid })
  return !!problem
}

function buildDistributionBuckets (
  values: Array<{ _id: number, count: number }>,
  bucketCount: number,
) {
  if (values.length === 0) {
    return []
  }

  const min = values[0]._id
  const max = values[values.length - 1]._id
  const width = Math.max(1, Math.ceil((max - min + 1) / bucketCount))

  const buckets = Array.from({ length: bucketCount }, (_, index) => ({
    lowerBound: min + (index * width),
    upperBound: min + ((index + 1) * width) - 1,
    count: 0,
  }))

  for (const value of values) {
    const bucketIndex = Math.min(
      Math.floor((value._id - min) / width),
      bucketCount - 1,
    )
    buckets[bucketIndex].count += value.count
  }

  return buckets
}

export async function getStatistics (problem: Types.ObjectId): Promise<ProblemStatisticsQueryResult> {
  return await cacheService.getOrCreate<ProblemStatisticsQueryResult>(
    CacheKey.problemStatistics(problem),

    async () => {
      const problemDoc = await Problem
        .findById(problem)
        .select({ _id: 0, pid: 1 })
        .lean()
      if (!problemDoc) {
        return { judgeCounts: [], timeDistribution: [], memoryDistribution: [] }
      }

      const { pid } = problemDoc
      const [ judgeCountsRaw, acceptedTimeRaw, acceptedMemoryRaw ] = await Promise.all([
        Solution.aggregate<{ _id: number, count: number }>([
          { $match: { pid, judge: { $in: JUDGE_STATUS_TERMINAL } } },
          { $group: { _id: '$judge', count: { $sum: 1 } } },
          { $sort: { _id: 1 } },
        ]),

        Solution.aggregate<{ _id: number, count: number }>([
          { $match: { pid, judge: JudgeStatus.Accepted } },
          { $group: { _id: '$time', count: { $sum: 1 } } },
          { $sort: { _id: 1 } },
        ]),

        Solution.aggregate<{ _id: number, count: number }>([
          { $match: { pid, judge: JudgeStatus.Accepted } },
          { $group: { _id: '$memory', count: { $sum: 1 } } },
          { $sort: { _id: 1 } },
        ]),
      ])

      return {
        judgeCounts: judgeCountsRaw.map(({ _id, count }) => ({ judge: _id, count })),
        timeDistribution: buildDistributionBuckets(acceptedTimeRaw, 20),
        memoryDistribution: buildDistributionBuckets(acceptedMemoryRaw, 20),
      }
    },

    { ttl: 30 },
  )
}

export async function findCourseProblems (
  course: Types.ObjectId | string,
  opt: PaginateOption & {
    type?: string
    content?: string
  },
): Promise<Paginated<ProblemEntityPreview & { owner: Types.ObjectId | null }>> {
  const { page, pageSize, type, content } = opt
  const filters: Record<string, any>[] = []

  if (content && type) {
    switch (type) {
      case 'title':
        filters.push({
          'problem.title': {
            $regex: new RegExp(escapeRegExp(String(content)), 'i'),
          },
        })
        break
      case 'tag':
        filters.push({
          'problem.tags': {
            $in: await tagService.findTagObjectIdsByQuery(String(content)),
          },
        })
        break
      case 'pid':
        filters.push({
          $expr: {
            $regexMatch: {
              input: { $toString: '$problem.pid' },
              regex: new RegExp(`^${escapeRegExp(String(content))}`, 'i'),
            },
          },
        })
        break
    }
  }

  const aggregationPipeline = [
    {
      $match: {
        course: new mongoose.Types.ObjectId(course.toString()),
      },
    },
    {
      $lookup: {
        from: 'Problem',
        localField: 'problem',
        foreignField: '_id',
        as: 'problem',
      },
    },
    {
      $unwind: '$problem',
    },
    ...(filters.length > 0 ? [ { $match: { $and: filters } } ] : []),
    {
      $lookup: {
        from: 'Tag',
        localField: 'problem.tags',
        foreignField: '_id',
        as: 'problem.tagsInfo',
      },
    },
    {
      $sort: { sort: 1, updatedAt: -1 },
    },
    {
      $facet: {
        paginatedResults: [
          { $skip: (page - 1) * pageSize },
          { $limit: pageSize },
          {
            $project: {
              _id: 0,
              problem: {
                pid: '$problem.pid',
                title: '$problem.title',
                status: '$problem.status',
                type: '$problem.type',
                tags: {
                  $map: {
                    input: '$problem.tagsInfo',
                    as: 'tag',
                    in: {
                      tagId: '$$tag.tagId',
                      name: '$$tag.name',
                      color: '$$tag.color',
                    },
                  },
                },
                submit: '$problem.submit',
                solve: '$problem.solve',
                owner: '$problem.owner',
              },
            },
          },
        ],
        totalCount: [
          { $count: 'count' },
        ],
      },
    },
    {
      $project: {
        docs: '$paginatedResults.problem',
        total: {
          $ifNull: [ { $arrayElemAt: [ '$totalCount.count', 0 ] }, 0 ],
        },
        pages: {
          $ceil: {
            $divide: [
              { $ifNull: [ { $arrayElemAt: [ '$totalCount.count', 0 ] }, 0 ] },
              pageSize,
            ],
          },
        },
        page: { $literal: page },
        limit: { $literal: pageSize },
      },
    },
  ] as PipelineStage[]

  const result = await CourseProblem.aggregate(aggregationPipeline).exec()
  return result[0] as Paginated<ProblemEntityPreview & { owner: Types.ObjectId | null }>
}

export async function findCourseProblemItems (
  course: Types.ObjectId | string,
  keyword: string,
  limit: number = 10,
): Promise<ProblemEntityItem[]> {
  const filters: Record<string, any>[] = []

  if (Number.isInteger(Number(keyword))) {
    filters.push({
      $expr: {
        $regexMatch: {
          input: { $toString: '$problem.pid' },
          regex: new RegExp(`^${escapeRegExp(keyword)}`, 'i'),
        },
      },
    })
  }
  filters.push({
    'problem.title': { $regex: new RegExp(escapeRegExp(keyword), 'i') },
  })

  const aggregationPipeline = [
    {
      $match: {
        course: new mongoose.Types.ObjectId(course.toString()),
      },
    },
    {
      $lookup: {
        from: 'Problem',
        localField: 'problem',
        foreignField: '_id',
        as: 'problem',
      },
    },
    {
      $unwind: '$problem',
    },
    {
      $match: { $or: filters },
    },
    {
      $sort: { sort: 1, updatedAt: -1 },
    },
    {
      $limit: limit,
    },
    {
      $project: {
        _id: 0,
        pid: '$problem.pid',
        title: '$problem.title',
      },
    },
  ] as PipelineStage[]

  const result = await CourseProblem.aggregate(aggregationPipeline).exec()
  return result as ProblemEntityItem[]
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
} as const

export default problemService
