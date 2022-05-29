import api from '@/api'
import { defineStore } from 'pinia'

export const useNewsStore = defineStore('news', {
  state: () => ({
    list: [],
    news: {},
    sum: 0
  }),
  actions: {
    findOne (payload) {
      return api.news.findOne(payload).then(({ data }) => {
        this.news = data.news
      })
    },
    find (payload) {
      return api.news.find(payload).then(({ data }) => {
        this.list = data.list.docs
        this.sum = data.list.total
      })
    },
    update (payload) {
      return api.news.update(payload).then(({ data }) => data.nid)
    },
    create (payload) {
      return api.news.create(payload).then(({ data }) => data.nid)
    },
    delete (payload) {
      return api.news.delete(payload).then(() => {
        this.list = this.list.filter((p) => p.nid !== +(payload.nid))
      })
    },
    setCurrentNews (news) {
      this.news = news
    }
  }
})
