import * as types from '../types'
import api from '@/api'

const store = {
  namespaced: true,
  state: {
    registerDialog: false,
    list: [],
    user: {},
    solved: [],
    unsolved: [],
    group: [],
    adminList: []
  },
  getters: {
    registerDialog: state => state.registerDialog,
    list: state => state.list,
    user: state => state.user,
    solved: state => state.solved,
    unsolved: state => state.unsolved,
    group: state => state.group,
    adminList: state => state.adminList
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
    [types.UPDATE_USERS_ADMIN_LIST]: (state, payload) => {
      state.adminList = payload
    },
    [types.UPDATE_SOLVED]: (state, payload) => {
      state.solved = payload
    },
    [types.UPDATE_UNSOLVED]: (state, payload) => {
      state.unsolved = payload
    },
    [types.UPDATE_USER_GROUP]: (state, payload) => {
      state.group = payload
    }
  },
  actions: {
    register ({ commit }, payload) {
      return api.register(payload)
    },
    find ({ commit }, payload) {
      return api.user.find(payload).then(({ data }) => {
        if (payload) {
          commit(types.UPDATE_USERS_ADMIN_LIST, data.list)
        } else {
          commit(types.UPDATE_USERS_LIST, data.list)
        }
      })
    },
    findOne ({ commit }, payload) {
      return api.user.findOne(payload).then(({ data }) => {
        commit(types.UPDATE_USER, data.user)
        commit(types.UPDATE_SOLVED, data.solved)
        commit(types.UPDATE_UNSOLVED, data.unsolved)
        commit(types.UPDATE_USER_GROUP, data.group)
      })
    },
    update ({ commit }, payoad) {
      return api.user.update(payoad)
    },
    delete ({ commit }, payload) {
      return api.user.delete(payload)
    }
  }
}

export default store
