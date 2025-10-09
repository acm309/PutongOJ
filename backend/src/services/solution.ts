import type {
  JudgeStatus,
  Language,
  Paginated,
  SolutionModel,
} from '@putongoj/shared'
import type { PaginateOption, SortOption } from '../types'
import Solution from '../models/Solution'

export async function findSolutions (
  opt: PaginateOption & SortOption & {
    user?: string
    problem?: number
    contest?: number
    judge?: JudgeStatus
    language?: Language
  },
): Promise<Paginated<SolutionModel>> {
  const { page, pageSize, sort, sortBy, user, problem, contest, judge, language } = opt

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

const solutionService = {
  findSolutions,
} as const

export default solutionService
