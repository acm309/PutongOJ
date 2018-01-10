import * as types from '../types'
import api from '@/api'

const store = {
  namespaced: true,
  state: {
    list: [],
    new: {},
    sum: 0
  },
  getters: {
    list: state => state.list,
    new: state => state.new,
    sum: state => state.sum
  },
  mutations: {
    [types.UPDATE_NEWS]: (state, payload) => {
      state.new = payload
    },
    [types.UPDATE_NEW_LIST]: (state, payload) => {
      state.list = payload
    },
    [types.UPDATE_NEWS_SUM]: (state, payload) => {
      state.sum = payload
    }
  },
  actions: {
    findOne ({ commit }, payload) {
      return api.news.findOne(payload).then(({ data }) => {
        commit(types.UPDATE_NEWS, data.res)
      })
    },
    find ({ commit }, payload) {
      return api.news.find(payload).then(({ data }) => {
        commit(types.UPDATE_NEW_LIST, data.res.docs)
        commit(types.UPDATE_NEWS_SUM, data.res.total)
      })
    }
  }
}

export default store
