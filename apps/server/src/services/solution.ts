import type {
  JudgeStatus,
  Language,
  Paginated,
  SolutionModel,
} from '@putongoj/shared'
import type { PaginateOption, SortOption } from '../types'
import { EXPORT_SIZE_MAX } from '@putongoj/shared'
import Solution from '../models/Solution'

interface SolutionFilterOption {
  user?: string
  problem?: number
  contest?: number
  judge?: JudgeStatus
  language?: Language
}

function constructSolutionFilter (opt: SolutionFilterOption) {
  const { user, problem, contest, judge, language } = opt
  const filter: Record<string, any> = {}

  if (typeof user === 'string') {
    filter.uid = user
  }
  if (typeof problem === 'number') {
    filter.pid = problem
  }
  if (typeof contest === 'number') {
    filter.mid = contest
  }
  if (typeof judge === 'number') {
    filter.judge = judge
  }
  if (typeof language === 'number') {
    filter.language = language
  }
  return filter
}

export async function findSolutions (
  opt: PaginateOption & SortOption & SolutionFilterOption,
): Promise<Paginated<SolutionModel>> {
  const { page, pageSize, sort, sortBy } = opt
  const filter = constructSolutionFilter(opt)

  const query = {
    sort: {
      [sortBy]: sort,
      ...(sortBy !== 'createdAt' ? { createdAt: -1 } : {}),
    },
    page,
    limit: pageSize,
    lean: true,
    leanWithId: false,
  }
  return await Solution.paginate(filter, query) as any
}

export async function exportSolutions (
  opt: SortOption & SolutionFilterOption,
): Promise<Pick<SolutionModel,
'sid' | 'pid' | 'uid' | 'mid' | 'language' | 'judge'
| 'time' | 'memory' | 'sim' | 'sim_s_id' | 'createdAt'>[]
> {
  const { sort, sortBy } = opt
  const filter = constructSolutionFilter(opt)

  return await Solution.find(filter)
    .select({
      _id: 0, sid: 1, pid: 1, uid: 1, mid: 1, language: 1, judge: 1,
      time: 1, memory: 1, sim: 1, sim_s_id: 1, createdAt: 1,
    })
    .sort({
      [sortBy]: sort,
      ...(sortBy !== 'createdAt' ? { createdAt: -1 } : {}),
    })
    .limit(EXPORT_SIZE_MAX)
    .lean()
}

const solutionService = {
  findSolutions,
  exportSolutions,
} as const

export default solutionService
