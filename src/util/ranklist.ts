import type { ContestDetail, Ranklist, RawRanklist } from '@/types'

const PENALTY = 20 * 60 * 1000 // 失败提交罚时 20 分钟

export function normalize (ranklist: RawRanklist, contest: ContestDetail): Ranklist {
  const list: Ranklist = [] // 结果

  Object.keys(ranklist).forEach((uid) => {
    const row = ranklist[uid]
    let solved = 0 // 记录 ac 几道题
    let penalty = 0 // 罚时，尽在 ac 时计算
    for (const pid of contest.list) {
      if (row[pid] == null) continue // 这道题没有交过
      const submission = row[pid]
      if (submission.accepted > -1) { // ac 了
        solved++
        penalty += submission.accepted - contest.start + submission.failed * PENALTY
      }
    }
    list.push({
      uid,
      solved,
      penalty,
      ...row,
    })
  })

  // 排序, 先按照 solved, 在按照 penalty
  list.sort((x, y) => {
    if (x.solved !== y.solved)
      return -(x.solved - y.solved)
    return x.penalty - y.penalty
  })

  // 接下来计算 primes
  const quickest: Record<number, number> = {} // 每到题最早提交的 ac 时间
  for (const pid of contest.list)
    quickest[pid] = Number.POSITIVE_INFINITY // init

  list.forEach((row) => {
    for (const pid of contest.list) {
      if (row[pid] != null && row[pid].accepted > -1)
        quickest[pid] = Math.min(quickest[pid], row[pid].accepted)
    }
  })

  list.forEach((row) => {
    for (const pid of contest.list) {
      if (row[pid] == null || row[pid].accepted === -1) continue
      if (quickest[pid] === row[pid].accepted) { // 这就是最早提交的那个
        row[pid].isPrime = true // 打上标记
      }
    }
  })
  return list
}
