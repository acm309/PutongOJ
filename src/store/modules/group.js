import * as types from '../types'
import api from '@/api'
import { defineStore } from 'pinia'

export const useGroupStore = defineStore('group', {
  state: () => ({
    list: [],
    group: {
      gid: '',
      title: '',
      list: []
    }
  }),
  actions: {
    async findOne (payload) {
      const {data} = await api.group.findOne(payload)
      this.group = data.group
    },
    async find () {
      const {data} = await api.group.find()
      this.list = data.list
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
      this.list = this.list.filter((p) => p.gid !== +(payload.gid))
    }
  }
})

const store = {
  namespaced: true,
  state: {
    list: [],
    group: {
      gid: '',
      title: '',
      list: []
    }
  },
  getters: {
    list: state => state.list,
    group: state => state.group
  },
  mutations: {
    [types.UPDATE_GROUP]: (state, payload) => {
      state.group = payload
    },
    [types.UPDATE_GROUP_LIST]: (state, payload) => {
      state.list = payload
    },
    [types.DELETE_GROUP]: (state, { gid }) => {
      state.list = state.list.filter((p) => p.gid !== +gid)
    }
  },
  actions: {
    findOne ({ commit }, payload) {
      return api.group.findOne(payload).then(({ data }) => {
        commit(types.UPDATE_GROUP, data.group)
      })
    },
    find ({ commit }) {
      return api.group.find().then(({ data }) => {
        commit(types.UPDATE_GROUP_LIST, data.list)
        return data.list
      })
    },
    update ({ commit }, payload) {
      return api.group.update(payload).then(({ data }) => data.gid)
    },
    create ({ commit }, payload) {
      return api.group.create(payload).then(({ data }) => data.gid)
    },
    delete ({ commit }, payload) {
      return api.group.delete(payload).then(() => {
        commit(types.DELETE_GROUP, payload)
      })
    }
  }
}

export default store
