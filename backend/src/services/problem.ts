import type { ProblemDocument } from '../models/Problem'
import type { Paginated, PaginateOption } from '../types'
import type { ProblemEntityEditable, ProblemEntityItem, ProblemEntityPreview } from '../types/entity'
import { ObjectId } from 'mongoose'
import path from 'node:path'
import fse from 'fs-extra'
import { escapeRegExp } from 'lodash'
import Problem from '../models/Problem'
import { status } from '../utils/constants'
import mongoose from 'mongoose'

export async function findProblems(
  opt: PaginateOption & {
    type?: string
    content?: string
    showReserved?: boolean
    includeOwner?: ObjectId | string | null
  },
): Promise<Paginated<ProblemEntityPreview & { owner: ObjectId | null }>> {
  const { page, pageSize, content, type, showReserved, includeOwner } = opt
  const filters: Record<string, any>[] = []

  if (!(showReserved === true)) {
    const statusFilters: Record<string, any>[]
      = [{ status: status.Available }]
    if (includeOwner) {
      statusFilters.push({
        owner: new mongoose.Types.ObjectId(includeOwner.toString()),
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
          tags: { $in: [new RegExp(escapeRegExp(String(content)), 'i')] },
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
    limit: pageSize,
    lean: true,
    leanWithId: false,
    select: '-_id pid title status type tags submit solve owner',
  }) as unknown as Paginated<ProblemEntityPreview & { owner: ObjectId | null }>
  return result
}

export async function findProblemItems(
  keyword: string,
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
      { sort: { pid: 1 }, limit: 10 },
    ).lean(),
    )
  }
  if (result.length < 10) {
    result.push(...await Problem.find(
      {
        pid: { $nin: result.map(p => p.pid) },
        title: { $regex: new RegExp(escapeRegExp(keyword), 'i') },
      },
      { _id: 0, pid: 1, title: 1 },
      { sort: { updatedAt: -1 }, limit: 10 - result.length },
    ).lean(),
    )
  }
  return result
}

export async function getProblemItems(): Promise<ProblemEntityItem[]> {
  const result = await Problem
    .find({}, { _id: 0, title: 1, pid: 1 })
    .lean()
  return result
}

export async function getProblem(
  pid: number,
): Promise<ProblemDocument | undefined> {
  const problem = await Problem.findOne({ pid })
  return problem ?? undefined
}

export async function createProblem(
  opt: ProblemEntityEditable,
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

export async function updateProblem(
  pid: number,
  opt: Partial<ProblemEntityEditable>,
): Promise<ProblemDocument | undefined> {
  const problem = await Problem
    .findOneAndUpdate({ pid }, opt, { new: true })
  return problem ?? undefined
}

export async function removeProblem(pid: number): Promise<boolean> {
  const problem = await Problem.deleteOne({ pid })
  return !!problem
}

const problemService = {
  findProblems,
  findProblemItems,
  getProblemItems,
  getProblem,
  createProblem,
  updateProblem,
  removeProblem,
}

export default problemService
