import * as types from '../types'
import api from '@/api'

const store = {
  namespaced: true,
  state: {
    registerDialog: false,
    list: [],
    one: {},
    solved: [],
    unsolved: []
  },
  getters: {
    registerDialog: state => state.registerDialog,
    list: state => state.list,
    one: state => state.one,
    solved: state => state.solved,
    unsolved: state => state.unsolved
  },
  mutations: {
    [types.SHOW_REGISTER]: (state) => {
      state.registerDialog = !state.registerDialog
    },
    [types.UPDATE_USER]: (state, payload) => {
      state.one = payload
    },
    [types.UPDATE_USERS_LIST]: (state, payload) => {
      state.list = payload
    },
    [types.UPDATE_SOLVED]: (state, payload) => {
      state.solved = payload
    },
    [types.UPDATE_UNSOLVED]: (state, payload) => {
      state.unsolved = payload
    }
  },
  actions: {
    register ({ commit }, payload) {
      return api.register(payload).then(({ data }) => {
        if (data.success) {
          commit(types.SHOW_REGISTER)
        }
        return data
      })
    },
    find ({ commit }, payload) {
      return api.getUserInfo(payload).then(({ data }) => {
        commit(types.UPDATE_USER, data.info)
        commit(types.UPDATE_SOLVED, data.solved)
        commit(types.UPDATE_UNSOLVED, data.unsolved)
      })
    }
  }
}

export default store
