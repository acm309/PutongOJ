import type { ContestDetailQueryResult } from '@putongoj/shared'
import { defineStore } from 'pinia'
import { getContest } from '@/api/contest'
import { contestLabeling } from '@/utils/format'

const CONTEST_CACHE_TIME = 60 * 1000 // 1 minute

export const useContestStore = defineStore('contest', {
  state: () => ({
    contest: {} as ContestDetailQueryResult,
    lastFetch: 0,
  }),
  getters: {
    contestId: state => state.contest.contestId,
    problems: state => state.contest.problems.sort((a, b) => a.index - b.index),
    problemLabels (state): Map<number, string> {
      const labelingStyle = state.contest.labelingStyle
      const labels = new Map<number, string>()
      this.problems.forEach(({ problemId, index }) => {
        labels.set(problemId, contestLabeling(index, labelingStyle))
      })
      return labels
    },
    problemTitles (): Map<number, string> {
      const titles = new Map<number, string>()
      this.problems.forEach(({ problemId, title }) => {
        titles.set(problemId, title)
      })
      return titles
    },
    problemOptions (): Array<{ label: string, value: number }> {
      const options = [] as Array<{ label: string, value: number }>
      this.problems.forEach(({ problemId, title }) => {
        const label = this.problemLabels.get(problemId)!
        options.push({
          label: `${label} - ${title}`,
          value: problemId,
        })
      })
      return options
    },
  },
  actions: {
    async loadContest (contestId: number) {
      const resp = await getContest(contestId)
      if (resp.success) {
        this.contest = resp.data
        this.lastFetch = Date.now()
      }
      return resp
    },
    async reloadContest () {
      return this.loadContest(this.contest.contestId)
    },
    async reloadContestIfNeeded () {
      if (Date.now() - this.lastFetch < CONTEST_CACHE_TIME) {
        return
      }
      await this.reloadContest()
    },
  },
})
