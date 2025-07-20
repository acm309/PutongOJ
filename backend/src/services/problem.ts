import type { ObjectId } from 'mongoose'
import type { ProblemDocument } from '../models/Problem'
import type { Paginated, PaginateOption } from '../types'
import type { ProblemEntityEditable, ProblemEntityItem, ProblemEntityPreview } from '../types/entity'
import path from 'node:path'
import fse from 'fs-extra'
import { escapeRegExp } from 'lodash'
import Problem from '../models/Problem'
import { status } from '../utils/constants'

export async function findProblems (
  opt: PaginateOption & {
    type?: string
    content?: string
  },
  showAll: boolean = false,
  course?: ObjectId | null,
): Promise<Paginated<ProblemEntityPreview>> {
  const { page, pageSize, content, type } = opt
  const filters: Record<string, any>[] = []

  if (!showAll) {
    filters.push({ status: status.Available })
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
          tags: { $in: [ new RegExp(escapeRegExp(String(content)), 'i') ] },
        })
        break
      case 'pid':
        filters.push({ $expr: { $regexMatch: {
          input: { $toString: '$pid' },
          regex: new RegExp(`^${escapeRegExp(String(content))}`, 'i') },
        } })
        break
    }
  }
  if (course) {
    filters.push({ course })
  } else if (!showAll) {
    filters.push({ $or: [
      { course: { $exists: false } },
      { course: null } ],
    })
  }

  const result = await Problem.paginate({ $and: filters }, {
    sort: { pid: 1 },
    page,
    limit: pageSize,
    lean: true,
    leanWithId: false,
    select: '-_id pid title status type tags submit solve',
  }) as any
  return result
}

export async function getAllProblems (): Promise<ProblemEntityItem[]> {
  const result = await Problem
    .find({}, { _id: 0, title: 1, pid: 1 })
    .lean()
  return result
}

export async function getProblem (
  pid: number,
): Promise<ProblemDocument | undefined> {
  const problem = await Problem.findOne({ pid }).populate('course')
  return problem ?? undefined
}

export async function createProblem (
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

export async function updateProblem (
  pid: number,
  opt: Partial<ProblemEntityEditable>,
): Promise<ProblemDocument | undefined> {
  const problem = await Problem
    .findOneAndUpdate({ pid }, opt, { new: true })
  return problem ?? undefined
}

export async function removeProblem (pid: number): Promise<boolean> {
  const problem = await Problem.deleteOne({ pid })
  return !!problem
}

const problemService = {
  findProblems,
  getAllProblems,
  getProblem,
  createProblem,
  updateProblem,
  removeProblem,
}

export default problemService
