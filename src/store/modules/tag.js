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
    },
    [types.DELETE_TAG]: (state, { tid }) => {
      state.list = state.list.filter((p) => p.tid !== +tid)
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
    },
    // create ({ commit }, payload) {
    //   return api.tag.create(payload).then(({ data }) => data.tid)
    // },
    delete ({ commit }, payload) {
      return api.tag.delete(payload).then(() => {
        commit(types.DELETE_TAG, payload)
      })
    }
  }
}

export default store
