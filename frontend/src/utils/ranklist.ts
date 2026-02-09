import type { ContestDetailQueryResult, ContestRanklistProblem, ContestRanklistQueryResult } from '@putongoj/shared'
import type { Cell } from 'exceljs'
import { contestLabeling } from './format'

export type ContestRanklistCell = {
  failedCount: number
  pendingCount: number
} & ({
  isSolved: false
} | {
  isSolved: true
  isFirstSolved: boolean
  penalty: number
  solvedAt: Date
  solvedAfterMinutes: number
})

export interface ContestRanklistRow {
  username: string
  nickname: string
  rank: number
  penalty: number
  solvedCount: number
  attemptedCount: number
  dirt: number
  problems: Record<number, ContestRanklistCell | undefined>
}

// every failed submission adds 20 minutes penalty
const PENALTY = 20

function buildProblemCell (p: ContestRanklistProblem, startsAt: Date): ContestRanklistCell {
  const { failedCount, pendingCount } = p
  if (!p.solvedAt) {
    return { isSolved: false, failedCount, pendingCount }
  }

  const solvedAt = new Date(p.solvedAt)
  const solvedAfterMinutes = Math.floor((solvedAt.getTime() - startsAt.getTime()) / 1000 / 60)

  // contest's startsAt may be changed after a submission is made,
  // so we need to consider that solvedAfterMinutes may be negative
  const penalty = failedCount * PENALTY + Math.max(solvedAfterMinutes, 0)

  return {
    isSolved: true,
    penalty,
    solvedAt,
    solvedAfterMinutes,
    failedCount,
    pendingCount,
    isFirstSolved: false, // to be calculated later
  }
}

function calculateDirt (solvedCount: number, attemptedCount: number): number {
  if (solvedCount === 0) {
    return 0
  }
  return (attemptedCount - solvedCount) / attemptedCount
}

export function buildRanklist (ranklist: ContestRanklistQueryResult, contest: ContestDetailQueryResult): ContestRanklistRow[] {
  const startsAt = new Date(contest.startsAt)
  const result: ContestRanklistRow[] = []
  const problemIds = new Set<number>()

  ranklist.forEach((u) => {
    const problems: ContestRanklistRow['problems'] = {}
    let attemptedCount = 0
    let solvedCount = 0
    let penalty = 0

    u.problems.forEach((p) => {
      const problemId = p.problemId
      const c = buildProblemCell(p, startsAt)

      if (c.isSolved) {
        attemptedCount += c.failedCount + 1
        solvedCount += 1
        penalty += c.penalty
      }
      problemIds.add(problemId)
      problems[problemId] = c
    })

    const dirt = calculateDirt(solvedCount, attemptedCount)
    const { username, nickname } = u
    result.push({
      username,
      nickname,
      penalty,
      solvedCount,
      attemptedCount,
      dirt,
      problems,
      rank: -1, // to be calculated later
    })
  })

  // sort by solvedCount desc, penalty asc, username asc
  result.sort((a, b) => {
    if (a.solvedCount !== b.solvedCount) {
      return b.solvedCount - a.solvedCount
    }
    if (a.penalty !== b.penalty) {
      return a.penalty - b.penalty
    }
    return a.username.localeCompare(b.username)
  })

  // calculate rank
  let accumulated = 0
  let currentRank = 0
  let lastSolvedCount = -1
  let lastPenalty = -1

  result.forEach((r) => {
    accumulated += 1
    if (r.solvedCount !== lastSolvedCount || r.penalty !== lastPenalty) {
      currentRank = accumulated
      lastSolvedCount = r.solvedCount
      lastPenalty = r.penalty
    }
    r.rank = currentRank
  })

  // calculate first solved
  Array.from(problemIds).forEach((p) => {
    let earliestSolvedAt: Date | null = null

    result.forEach((r) => {
      const c = r.problems[p]
      if (c && c.isSolved && (!earliestSolvedAt || c.solvedAt < earliestSolvedAt)) {
        earliestSolvedAt = c.solvedAt
      }
    })

    if (!earliestSolvedAt) {
      return
    }

    result.forEach((r) => {
      const c = r.problems[p]
      if (c && c.isSolved && c.solvedAt.getTime() === earliestSolvedAt!.getTime()) {
        c.isFirstSolved = true
      }
    })
  })

  return result
}

export async function exportSheet (
  ranklist: ContestRanklistRow[],
  contest: ContestDetailQueryResult,
): Promise<void> {
  const ExcelJS = await import('exceljs')
  const workbook = new ExcelJS.Workbook()
  const worksheet = workbook.addWorksheet('Ranklist')
  const problems = contest.problems.sort((a, b) => a.index - b.index)

  worksheet.columns = [
    { header: 'Rank', width: 6 },
    { header: 'Username', width: 16 },
    { header: 'Nickname', width: 16 },
    { header: 'Solved', width: 8 },
    { header: 'Penalty', width: 8 },
    ...problems.map(p => ({
      header: contestLabeling(p.index, contest.labelingStyle),
      width: 10,
    })),
  ]

  const applyStyle = (
    cell: Cell,
    options: {
      bold?: boolean
      color?: string
      border?: boolean
      fill?: string
    },
  ) => {
    const { bold, color, border, fill } = options

    if (bold || color) {
      cell.font = {
        bold: bold || false,
        color: color ? { argb: color } : undefined,
      }
    }

    if (border) {
      cell.border = Object.fromEntries(
        [ 'top', 'left', 'bottom', 'right' ]
          .map(side => [ side, { style: 'thin' } ]),
      )
    }

    if (fill) {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: fill },
      }
    }
  }

  const headerRow = worksheet.getRow(1)
  headerRow.eachCell((cell) => {
    applyStyle(cell, {
      bold: true,
      border: true,
      fill: 'D9D9D9',
    })
  })

  ranklist.forEach((row) => {
    const excelRow = worksheet.addRow([
      row.rank,
      row.username,
      row.nickname || '',
      row.solvedCount,
      row.penalty,
      ...problems.map((p) => {
        const c = row.problems[p.problemId]
        if (!c) {
          return '-'
        }
        if (!c.isSolved) {
          return c.failedCount > 0 ? `-${c.failedCount}` : '-'
        }
        return `${c.failedCount > 0 ? `+${c.failedCount}` : '+'} (${c.solvedAfterMinutes})`
      }),
    ])

    problems.forEach((p, i) => {
      const cell = excelRow.getCell(i + 6)
      const c = row.problems[p.problemId]
      if (!c) {
        return
      }
      if (c.isSolved) {
        applyStyle(cell, {
          bold: true,
          color: c.isFirstSolved ? '0000FF' : '008000',
          border: true,
        })
      } else if (c.failedCount > 0) {
        applyStyle(cell, { color: 'FF0000', border: true })
      }
    })

    excelRow.eachCell((cell) => {
      if (!cell.border) {
        applyStyle(cell, { border: true })
      }
    })
  })

  const buffer = await workbook.xlsx.writeBuffer()
  const blob = new Blob([ buffer ], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })

  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = `${contest.title} - Ranklist - ${Date.now()}.xlsx`
  link.click()
}
