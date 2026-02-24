import { defineStore } from 'pinia'
import api from '@/api'

export const useNewsStore = defineStore('news', {
  state: () => ({
    list: [] as any[],
    news: {} as any,
    sum: 0,
  }),
  actions: {
    async findOne (payload: any) {
      return api.news.findOne(payload).then(({ data }) => {
        this.news = data.news
      })
    },
    async find (payload: any) {
      return api.news.find(payload).then(({ data }) => {
        this.list = data.list.docs
        this.sum = data.list.total
      })
    },
    async update (payload: any) {
      return api.news.update(payload).then(({ data }) => data.nid)
    },
    async create (payload: any) {
      return api.news.create(payload).then(({ data }) => data.nid)
    },
    async delete (payload: any) {
      return api.news.delete(payload).then(() => {
        this.list = this.list.filter(p => p.nid !== +(payload.nid))
      })
    },
    setCurrentNews (news: any) {
      this.news = news
    },
  },
})
