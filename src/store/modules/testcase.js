import * as types from '../types'
import api from '@/api'

const store = {
  namespaced: true,
  state: {
    list: [],
    testcase: {}
  },
  getters: {
    list: state => state.list,
    testcase: state => state.testcase
  },
  mutations: {
    [types.UPDATE_TESTCASE]: (state, payload) => {
      state.testcase = payload
    },
    [types.UPDATE_TESTCASE_LIST]: (state, payload) => {
      state.list = payload
    },
    [types.DELETE_TESTCASE]: (state, { gid }) => {
      state.list = state.list.filter((p) => p.gid !== +gid)
    }
  },
  actions: {
    findOne ({ commit }, payload) {
      return api.testcase.findOne(payload).then(({ data }) => {
        commit(types.UPDATE_TESTCASE, data)
      })
    },
    find ({ commit }, payload) {
      return api.testcase.find(payload).then(({ data }) => {
        commit(types.UPDATE_TESTCASE_LIST, data)
        return data
      })
    },
    create ({commit}, payload) {
      return api.testcase.create(payload)
    },
    delete ({commit}, payload) {
      return api.testcase.delete(payload).then(() => {
        commit(types.DELETE_TESTCASE, payload)
      })
    }
  }
}

export default store
