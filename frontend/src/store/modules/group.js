import { defineStore } from 'pinia'
import api from '@/api'

export const useGroupStore = defineStore('group', {
  state: () => ({
    list: [],
    group: {
      gid: '',
      title: '',
      list: [],
    },
  }),
  actions: {
    async findOne (payload) {
      const { data } = await api.group.findOne(payload)
      this.group = data.group
    },
    async find (payload = {}) {
      const { data } = await api.group.find(payload)
      this.list = data.list.toSorted(
        (x, y) => x.title.localeCompare(y.title),
      )
      return data.list
    },
    update (payload) {
      return api.group.update(payload).then(({ data }) => data.gid)
    },
    create (payload) {
      return api.group.create(payload).then(({ data }) => data.gid)
    },
    async delete (payload) {
      await api.group.delete(payload)
      this.list = this.list.filter(p => p.gid !== +(payload.gid))
    },
    clearSavedGroups () {
      this.list = []
    },
  },
})
