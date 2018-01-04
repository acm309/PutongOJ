import * as types from '../types'
import api from '../../api.js'

// 初始化时用sessionStorage.getItem('token')，这样子刷新页面就无需重新登录
const state = {
  loginDialog: false,
  profile: null
}

// getters
const getters = {
  loginDialog: state => state.loginDialog,
  profile: state => state.profile
}

// mutations
const mutations = {
  [types.LOGIN]: (state, payload) => {
    state.profile = payload.user // TODO
  },
  [types.LOGOUT]: (state) => {
    // 登出的时候要清除token
  },
  [types.SHOW_LOGIN]: (state) => {
    state.loginDialog = !state.loginDialog
  }
}

// actions
const actions = {
  login ({ commit }, opt) {
    return api.login(opt).then(({ data }) => { // 解构赋值拿到data
      commit(types.LOGIN, data)
      commit(types.SHOW_LOGIN)
      return data
    })
  },
  'session.fetch' ({ commit }) {

  }
}

export default {
  state,
  getters,
  actions,
  mutations
}
