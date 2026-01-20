import type { ContestEntityView } from '@backend/types/entity'
import type { ContestDetailQueryResult } from '@putongoj/shared'
import type { Cell } from 'exceljs'
import type { Ranklist, RawRanklist } from '@/types'
import { contestLabeling } from './formate'

const PENALTY = 20 // 失败提交罚时 20 分钟

export function normalize (ranklist: RawRanklist, contest: ContestDetailQueryResult): Ranklist {
  const startsAt = new Date(contest.startsAt).getTime()
  const problemIds = contest.problems.map(p => p.problemId)
  const list: Ranklist = [] // 结果

  Object.keys(ranklist).forEach((uid) => {
    const row = ranklist[uid]
    let solved = 0 // 记录 AC 几道题
    let penalty = 0 // 罚时（分钟），仅在 AC 时计算
    for (const pid of problemIds) {
      if (row[pid] == null) continue // 这道题没有交过
      const submission = row[pid]
      if (submission.acceptedAt) {
        solved++
        penalty += Math.max(0, Math.floor((submission.acceptedAt - startsAt) / 1000 / 60))
        penalty += submission.failed * PENALTY
      }
    }
    list.push({
      rank: -1, // 先占位，后面会重新计算排名
      uid,
      solved,
      penalty,
      ...row,
    })
  })

  // 排序, 先按照 solved 降序，再按照 penalty 升序，最后按照 uid 升序
  list.sort((x, y) => {
    if (x.solved !== y.solved) {
      return y.solved - x.solved
    }
    if (x.penalty !== y.penalty) {
      return x.penalty - y.penalty
    }
    return x.uid.localeCompare(y.uid)
  })

  // 重新计算排名
  let currentRank = 0
  let calculated = 0
  let lastSolved = -1
  let lastPenalty = -1
  list.forEach((row) => {
    calculated++
    if (row.solved !== lastSolved || row.penalty !== lastPenalty) {
      currentRank = calculated
      lastSolved = row.solved
      lastPenalty = row.penalty
    }
    row.rank = currentRank
  })

  // 接下来计算每道题的最早提交
  const quickest: Record<number, number> = {} // 每到题最早提交的 AC 时间
  for (const pid of problemIds) {
    quickest[pid] = Number.POSITIVE_INFINITY
  }

  list.forEach((row) => {
    for (const pid of problemIds) {
      if (row[pid]?.acceptedAt) {
        quickest[pid] = Math.min(
          quickest[pid],
          row[pid].acceptedAt,
        )
      }
    }
  })

  list.forEach((row) => {
    for (const pid of problemIds) {
      if (!row[pid]?.acceptedAt) continue
      if (quickest[pid] === row[pid].acceptedAt) { // 这就是最早提交的那个
        row[pid].isPrime = true // 打上标记
      }
    }
  })

  return list
}

export async function exportSheet (
  contest: ContestEntityView,
  ranklist: Ranklist,
): Promise<void> {
  const ExcelJS = await import('exceljs')
  const workbook = new ExcelJS.Workbook()
  const worksheet = workbook.addWorksheet('Ranklist')

  worksheet.columns = [
    { header: 'Rank', width: 6 },
    { header: 'Username', width: 16 },
    { header: 'Nickname', width: 16 },
    { header: 'Solved', width: 8 },
    { header: 'Penalty', width: 8 },
    ...contest.list.map((_, i) => ({
      header: contestLabeling(i + 1, contest.option?.labelingStyle),
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
      row.uid,
      row.nick || '',
      row.solved,
      row.penalty,
      ...contest.list.map((pid) => {
        const status = row[pid]
        if (!status) return '-'
        if (!status.acceptedAt) return `-${status.failed}`
        let time = '-'
        if (status.acceptedAt >= contest.start) {
          time = String(Math.floor((status.acceptedAt - contest.start) / 1000 / 60))
        }
        return `+${status.failed > 0 ? status.failed : ''} (${time})`
      }),
    ])

    contest.list.forEach((pid, index) => {
      const cell = excelRow.getCell(index + 6)
      const status = row[pid]

      if (!status) return
      if (status.acceptedAt) {
        applyStyle(cell, {
          bold: true,
          color: status.isPrime ? '0000FF' : '008000',
          border: true,
        })
      } else if (status.failed > 0) {
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
