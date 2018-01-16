import * as types from '../types'
import api from '@/api'

const store = {
  namespaced: true,
  state: {
    list: [],
    group: {}
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
        commit(types.UPDATE_GROUP, data.res)
      })
    },
    find ({ commit }, payload) {
      return api.group.find(payload).then(({ data }) => {
        commit(types.UPDATE_GROUP_LIST, data.res)
        return data.res
      })
    },
    update ({commit}, payload) {
      return api.group.update(payload).then(({ data }) => data.gid)
    },
    create ({commit}, payload) {
      return api.group.create(payload).then(({ data }) => data.gid)
    },
    delete ({commit}, payload) {
      return api.group.delete(payload).then(() => {
        commit(types.DELETE_GROUP, payload)
      })
    }
  }
}

export default store
