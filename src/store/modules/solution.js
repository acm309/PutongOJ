import * as types from '../types'
import api from '@/api'

const store = {
  namespaced: true,
  state: {
    list: [],
    solution: {},
    sum: 0,
    codeDialog: false
  },
  getters: {
    list: state => state.list,
    solution: state => state.solution,
    sum: state => state.sum,
    codeDialog: state => state.codeDialog
  },
  mutations: {
    [types.GET_SOLUTION]: (state, payload) => {
      state.solution = payload
    },
    [types.UPDATE_SOLUTION_LIST]: (state, payload) => {
      state.list = payload
    },
    [types.UPDATE_SUM_SOLUTIONS]: (state, payload) => {
      state.sum = payload
    },
    [types.SHOW_CODE]: (state, payload) => {
      state.codeDialog = true
      state.solution = payload
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
    },
    findOne ({ commit }, payload) {
      return api.findOneSolution(payload).then(({ data }) => {
        commit(types.GET_SOLUTION, data.doc)
      })
    }
  }
}

export default store
