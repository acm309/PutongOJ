import * as types from '../types'
import api from '@/api'

const store = {
  namespaced: true,
  state: {
    list: [],
    news: {},
    sum: 0
  },
  getters: {
    list: state => state.list,
    news: state => state.news,
    sum: state => state.sum
  },
  mutations: {
    [types.UPDATE_NEWS]: (state, payload) => {
      state.news = payload
    },
    [types.UPDATE_NEW_LIST]: (state, payload) => {
      state.list = payload
    },
    [types.UPDATE_NEWS_SUM]: (state, payload) => {
      state.sum = payload
    },
    [types.DELETE_NEWS]: (state, { nid }) => {
      state.list = state.list.filter((p) => p.nid !== +nid)
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
    },
    update ({commit}, payload) {
      return api.news.update(payload).then(({ data }) => data.nid)
    },
    create ({commit}, payload) {
      return api.news.create(payload).then(({ data }) => data.nid)
    },
    delete ({commit}, payload) {
      return api.news.delete(payload).then(() => {
        commit(types.DELETE_NEWS, payload)
      })
    }
  }
}

export default store
