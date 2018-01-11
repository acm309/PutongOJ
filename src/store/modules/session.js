import * as types from '../types'
import api from '@/api'

// 初始化时用sessionStorage.getItem('token')，这样子刷新页面就无需重新登录
const state = {
  loginDialog: false,
  profile: null
}

const getters = {
  loginDialog: state => state.loginDialog,
  profile: state => state.profile,
  isLogined: state => state.profile != null
}

const mutations = {
  [types.LOGIN]: (state, payload) => {
    state.profile = payload.profile // TODO
    window.localStorage.setItem('token', payload.token)
  },
  [types.LOGOUT]: (state) => {
    state.profile = null
    window.localStorage.removeItem('token')
  },
  [types.TRIGGER_LOGIN]: (state) => {
    state.loginDialog = !state.loginDialog
  },
  [types.UPDATE_PROFILE]: (state, payload) => {
    state.profile = payload
  }
}

const actions = {
  login ({ commit }, opt) {
    return api.login(opt).then(({ data }) => {
      commit(types.LOGIN, data)
      return data
    })
  },
  logout ({ commit }) {
    return api.logout().then(() => {
      commit(types.LOGOUT)
    })
  },
  fetch ({ commit }) {
    return api.session.fetch().then(({ data }) => {
      if (data.status === 'success') {
        commit(types.UPDATE_PROFILE, data.profile)
      }
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
