import * as types from '../types'
import api from '@/api'

const store = {
  namespaced: true,
  state: {
    registerDialog: false,
    list: [],
    user: {},
    solved: [],
    unsolved: []
  },
  getters: {
    registerDialog: state => state.registerDialog,
    list: state => state.list,
    user: state => state.user,
    solved: state => state.solved,
    unsolved: state => state.unsolved
  },
  mutations: {
    [types.SHOW_REGISTER]: (state) => {
      state.registerDialog = !state.registerDialog
    },
    [types.UPDATE_USER]: (state, payload) => {
      state.user = payload
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
      return api.register(payload)
    },
    findOne ({ commit }, payload) {
      return api.user.findOne(payload).then(({ data }) => {
        commit(types.UPDATE_USER, data.info)
        commit(types.UPDATE_SOLVED, data.solved)
        commit(types.UPDATE_UNSOLVED, data.unsolved)
      })
    },
    update ({ commit }, payoad) {
      return api.user.update(payoad)
    }
  }
}

export default store
