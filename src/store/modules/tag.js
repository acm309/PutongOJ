import api from '@/api'
import { defineStore } from 'pinia'

export const useTagStore = defineStore('tag', {
  state: () => ({
    list: [],
    tag: {
      tid: '',
      list: []
    }
  }),
  actions: {
    async findOne (payload) {
      const {data} = await api.tag.findOne(payload)
      this.tag = data.tag
    },
    async find () {
      const {data} = await api.tag.find()
      this.list = data.list
      return data.list
    },
    update (payload) {
      return api.tag.update(payload).then(({ data }) => data.tid)
    },
    create (payload) {
      return api.tag.create(payload).then(({ data }) => data.tid)
    },
    async delete (payload) {
      await api.tag.delete(payload)
      this.list = this.list.filter((p) => p.tid !== +(payload.tid))
    },
    clearSavedTags () {
      this.list = []
    }
  }
})
