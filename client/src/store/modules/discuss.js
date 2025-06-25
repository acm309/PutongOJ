import { defineStore } from 'pinia'
import api from '@/api'

export const useDiscussStore = defineStore('discuss', {
  state: () => ({
    list: [],
    discuss: {},
  }),
  actions: {
    async findOne (payload) {
      const { data } = await api.discuss.findOne(payload)
      data.discuss.comments = data.discuss.comments.sort((x, y) => x.create - y.create)
      this.discuss = data.discuss
      return data
    },
    async find (payload) {
      const { data } = await api.discuss.find(payload)
      if (data.list != null && Array.isArray(data.list))
        data.list = data.list.sort((x, y) => -x.update + y.update)

      this.list = data.list
    },
    update (payload) {
      return api.discuss.update(payload).then(({ data }) => data)
    },
    create (payload) {
      return api.discuss.create(payload).then(({ data }) => data)
    },
    async delete (payload) {
      await api.discuss.delete(payload)
      this.list = this.list.filter(p => p.did !== +(payload.did))
    },
  },
})
