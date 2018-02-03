import * as types from '../types'
import api from '@/api'

const store = {
  namespaced: true,
  state: {
    list: [],
    tag: {}
  },
  getters: {
    list: state => state.list,
    tag: state => state.tag
  },
  mutations: {
    [types.UPDATE_TAG]: (state, payload) => {
      state.tag = payload
    },
    [types.UPDATE_TAG_LIST]: (state, payload) => {
      state.list = payload
    }
  },
  actions: {
    findOne ({ commit }, payload) {
      return api.tag.findOne(payload).then(({ data }) => {
        commit(types.UPDATE_TAG, data.tag)
      })
    },
    find ({ commit }) {
      return api.tag.find().then(({ data }) => {
        commit(types.UPDATE_TAG_LIST, data.list)
        return data.list
      })
    },
    update ({ commit }, payload) {
      return api.tag.update(payload).then(({ data }) => data.tid)
    }
  }
}

export default store
