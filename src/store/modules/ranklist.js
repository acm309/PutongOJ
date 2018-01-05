import * as types from '../types'
import api from '@/api'

const store = {
  namespaced: true,
  state: {
    list: [],
    sum: 0
  },
  getters: {
    list: state => state.list,
    sum: state => state.sum
  },
  mutations: {
    [types.UPDATE_RANKLIST]: (state, payload) => {
      state.list = payload
    },
    [types.UPDATE_SUM_RANKLIST]: (state, payload) => {
      state.sum = payload
    }
  },
  actions: {
    find ({ commit }, payload) {
      return api.getRanklist(payload).then(({ data }) => {
        commit(types.UPDATE_RANKLIST, data.res.docs)
        commit(types.UPDATE_SUM_RANKLIST, data.res.total)
      })
    }
  }
}

export default store
