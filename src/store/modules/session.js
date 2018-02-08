import * as types from '../types'
import api from '@/api'

const state = {
  loginDialog: false,
  profile: null,
  isAdmin: false
}

const getters = {
  loginDialog: state => state.loginDialog,
  profile: state => state.profile,
  isLogined: state => state.profile != null,
  isAdmin: (state, getters, rootState, rootGetters) => (
    getters.isLogined &&
    (
      parseInt(state.profile.privilege) === parseInt(rootGetters.privilege.Root) ||
      parseInt(state.profile.privilege) === parseInt(rootGetters.privilege.Teacher)
    )
  )
}

const mutations = {
  [types.LOGIN]: (state, payload) => {
    state.profile = payload // TODO
  },
  [types.LOGOUT]: (state) => {
    state.profile = null
  },
  [types.TRIGGER_LOGIN]: (state) => {
    state.loginDialog = !state.loginDialog
  },
  [types.UPDATE_PROFILE]: (state, payload) => {
    state.profile = payload
  }
}

const actions = {
  login ({ commit, rootGetters }, opt) {
    return api.login(opt).then(({ data }) => {
      commit(types.LOGIN, data.profile)
      return data
    })
  },
  logout ({ commit }) {
    return api.logout().then(() => {
      commit(types.LOGOUT)
    })
  },
  fetch ({ commit, rootGetters }) {
    return api.session.fetch().then(({ data }) => {
      commit(types.UPDATE_PROFILE, data.profile)
    })
  }
}

export default {
  namespaced: true,
  state,
  getters,
  actions,
  mutations
}
