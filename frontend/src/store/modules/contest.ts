import type { ContestEntityPreview, ContestEntityView } from '@backend/types/entity'
import { defineStore } from 'pinia'
import api from '@/api'
import { contestLabeling } from '@/utils/formate'

export const useContestStore = defineStore('contest', {
  state: () => ({
    list: [] as ContestEntityPreview[],
    sum: 0,
    contest: {} as ContestEntityView,
    overview: [] as { title: string, pid: number, invalid?: boolean, submit: number, solve: number }[],
    totalProblems: 0,
    solved: [] as any[],
  }),
  getters: {
    contestId (state): number {
      return state.contest.cid
    },
    problems: state => state.contest.list,
    problemMap (): Map<number, number> {
      const map = new Map<number, number>()
      this.problems.forEach((problem, index) => {
        map.set(problem, index)
      })
      return map
    },
    problemLabels (state): Map<number, string> {
      const labelingStyle = state.contest.option.labelingStyle
      const labels = new Map<number, string>()
      this.problemMap.forEach((index, problem) => {
        labels.set(problem, contestLabeling(index + 1, labelingStyle))
      })
      return labels
    },
    problemTitles (state): Map<number, string> {
      const titles = new Map<number, string>()
      this.problemMap.forEach((index, problem) => {
        titles.set(problem, state.overview[index]!.title)
      })
      return titles
    },
    problemOptions (): Array<{ label: string, value: number }> {
      const options = [] as Array<{ label: string, value: number }>
      this.problems.forEach((problem) => {
        const label = this.problemLabels.get(problem)!
        const title = this.problemTitles.get(problem)!
        options.push({
          label: `${label} - ${title}`,
          value: problem,
        })
      })
      return options
    },
  },
  actions: {
    async find (payload: { [key: string]: any }): Promise<void> {
      const { data } = await api.contest.find(payload)
      this.list = data.list.docs
      this.sum = data.list.total
    },
    async findOne (payload: { [key: string]: any }): Promise<ContestEntityView> {
      const { data } = await api.contest.findOne(payload)
      this.contest = data.contest
      this.overview = data.overview
      this.totalProblems = data.totalProblems
      this.solved = data.solved
      return data
    },
    async create (payload: { [key: string]: any }): Promise<number> {
      const { data } = await api.contest.create(payload)
      return data.cid
    },
    async update (payload: { [key: string]: any }): Promise<number> {
      const { data } = await api.contest.update(payload)
      return data.cid
    },
    async delete (payload: { [key: string]: any }): Promise<void> {
      await api.contest.delete(payload)
      this.list = this.list.filter(p => p.cid !== +(payload.cid))
    },
    async verify (payload: { [key: string]: any }): Promise<boolean> {
      const { data } = await api.contest.verify(payload)
      return data.isVerify
    },
  },
})
