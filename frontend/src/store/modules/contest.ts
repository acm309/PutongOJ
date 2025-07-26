import type { ContestEntityPreview, ContestEntityView } from '@backend/types/entity'
import { defineStore } from 'pinia'
import api from '@/api'

export const useContestStore = defineStore('contest', {
  state: () => ({
    list: [] as ContestEntityPreview[],
    sum: 0,
    contest: {} as ContestEntityView,
    overview: [] as any[],
    totalProblems: 0,
    solved: [] as any[],
  }),
  getters: {
    problems: state => state.contest.list,
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
