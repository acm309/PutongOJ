import * as types from '../types'
import api from '../../api.js'

const store = {
  namespaced: true,
  state: {
    list: [],
    one: {},
    sum: 0,
    codeDialog: false
  },
  getters: {
    list: state => state.list,
    one: state => state.one,
    sum: state => state.sum,
    codeDialog: state => state.codeDialog
  },
  mutations: {
    [types.UPDATE_SOLUTION_LIST]: (state, payload) => {
      state.list = payload
    },
    [types.UPDATE_SUM_SOLUTIONS]: (state, payload) => {
      state.sum = payload
    },
    [types.SHOW_CODE]: (state, payload) => {
      state.codeDialog = true
      state.one = payload
    },
    [types.CLOSE_CODE]: (state) => {
      state.codeDialog = false
    }
  },
  actions: {
    find ({ commit }, payload) {
      return api.getSolutions(payload).then(({ data }) => {
        commit(types.UPDATE_SOLUTION_LIST, data.res.docs)
        commit(types.UPDATE_SUM_SOLUTIONS, data.res.total)
      })
    }
  }
}

export default store
