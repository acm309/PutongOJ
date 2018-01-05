import * as types from '../types'
import api from '@/api'

const store = {
  namespaced: true,
  state: {
    list: [],
    one: {}
  },
  getters: {
    list: state => state.list,
    one: state => state.one
  },
  mutations: {
    [types.UPDATE_NEWS]: (state, payload) => {
      state.one = payload
    },
    [types.UPDATE_NEW_LIST]: (state, payload) => {
      state.list = payload
    }
  },
  actions: {
    findOne ({ commit }, payload) {
      return api.news.findOne(payload).then(({ data }) => {
        commit(types.UPDATE_NEWS, data)
      })
    },
    find ({ commit }, payload) {
      return api.news.find(payload).then(({ data }) => {
        commit(types.UPDATE_NEW_LIST, data)
      })
    }
  }
}

export default store
