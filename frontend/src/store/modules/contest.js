import api from '@/api'
import { defineStore } from 'pinia'

export const useContestStore = defineStore('contest', {
  state: () => ({
    list: [],
    sum: 0,
    contest: {},
    overview: [],
    totalProblems: 0,
    solved: [],
  }),
  getters: {
    problems: state => state.contest.list,
  },
  actions: {
    async find (payload) {
      const { data } = await api.contest.find(payload)
      this.list = data.list.docs
      this.sum = data.list.total
    },
    async findOne (payload) {
      const { data } = await api.contest.findOne(payload)
      this.contest = data.contest
      this.overview = data.overview
      this.totalProblems = data.totalProblems
      this.solved = data.solved
      return data
    },
    create (payload) {
      return api.contest.create(payload).then(({ data }) => data.cid)
    },
    update (payload) {
      return api.contest.update(payload).then(({ data }) => data.cid)
    },
    async delete (payload) {
      await api.contest.delete(payload)
      this.list = this.list.filter(p => p.cid !== +(payload.cid))
    },
    verify (payload) {
      return api.contest.verify(payload).then(({ data }) => data.isVerify)
    },
  },
})
