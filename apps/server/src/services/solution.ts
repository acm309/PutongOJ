import type { Submission } from '@putongoj/db'
import type { PaginatedResult } from '@putongoj/shared'
import type { PaginateOption, SortOption } from '../types'
import { EXPORT_SIZE_MAX } from '@putongoj/shared'
import { getDatabase } from '../config/postgres'

interface SubmissionFilterOption {
  username?: string
  problemId?: number
  contestId?: number
  status?: Submission['status']
  language?: Submission['language']
}

type ExportedSubmission = Pick<Submission,
  'id' | 'problemId' | 'userId' | 'contestId' | 'language' | 'status'
  | 'timeUsedMs' | 'memoryUsedKb' | 'similarity' | 'similarSubmissionId' | 'createdAt'
>

function buildWhere (opt: SubmissionFilterOption) {
  return {
    ...(opt.username === undefined ? {} : { user: { username: opt.username } }),
    ...(opt.problemId === undefined ? {} : { problemId: opt.problemId }),
    ...(opt.contestId === undefined ? {} : { contestId: opt.contestId }),
    ...(opt.status === undefined ? {} : { status: opt.status }),
    ...(opt.language === undefined ? {} : { language: opt.language }),
  }
}

function orderBy (sortBy: string, sort: 'asc' | 'desc') {
  const supported = new Set([
    'id',
    'createdAt',
    'updatedAt',
    'timeUsedMs',
    'memoryUsedKb',
    'similarity',
  ])
  const field = supported.has(sortBy) ? sortBy : 'createdAt'
  return [
    { [field]: sort },
    ...(field === 'createdAt' ? [] : [ { createdAt: 'desc' as const } ]),
  ]
}

export async function findSolutions (
  opt: PaginateOption & SortOption & SubmissionFilterOption,
): Promise<PaginatedResult<Submission>> {
  const database = await getDatabase()
  const where = buildWhere(opt)
  const [ rows, total ] = await Promise.all([
    database.submission.findMany({
      where,
      orderBy: orderBy(opt.sortBy, opt.sort),
      skip: (opt.page - 1) * opt.pageSize,
      take: opt.pageSize,
    }),
    database.submission.count({ where }),
  ])

  return {
    items: rows,
    page: opt.page,
    pageSize: opt.pageSize,
    total,
  }
}

export async function exportSolutions (
  opt: SortOption & SubmissionFilterOption,
): Promise<ExportedSubmission[]> {
  const database = await getDatabase()
  const rows = await database.submission.findMany({
    where: buildWhere(opt),
    orderBy: orderBy(opt.sortBy, opt.sort),
    take: EXPORT_SIZE_MAX,
  })
  return rows
}

const solutionService = { findSolutions, exportSolutions } as const
export default solutionService
