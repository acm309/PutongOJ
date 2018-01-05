import * as types from '../types'
import api from '@/api'

// 初始化时用sessionStorage.getItem('token')，这样子刷新页面就无需重新登录
const state = {
  loginDialog: false,
  profile: null
}

const getters = {
  loginDialog: state => state.loginDialog,
  profile: state => state.profile
}

const mutations = {
  [types.LOGIN]: (state, payload) => {
    state.profile = payload.user // TODO
  },
  [types.LOGOUT]: (state) => {
    // 登出的时候要清除token
  },
  [types.TRIGGER_LOGIN]: (state) => {
    state.loginDialog = !state.loginDialog
  }
}

const actions = {
  login ({ commit }, opt) {
    return api.login(opt).then(({ data }) => {
      commit(types.LOGIN, data)
      return data
    })
  },
  'session.fetch' ({ commit }) {

  }
}

export default {
  namespaced: true,
  state,
  getters,
  actions,
  mutations
}
