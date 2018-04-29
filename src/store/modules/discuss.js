import * as types from '../types'
import api from '@/api'

const store = {
  namespaced: true,
  state: {
    list: [],
    discuss: {}
  },
  getters: {
    list: state => state.list,
    discuss: state => state.discuss
  },
  mutations: {
    [types.GET_DISCUSS]: (state, payload) => {
      state.discuss = payload
    },
    [types.GET_DISCUSS_LIST]: (state, payload) => {
      state.list = payload
    }
  },
  actions: {
    findOne ({ commit }, payload) {
      return api.discuss.findOne(payload).then(({ data }) => {
        data.discuss.comments = data.discuss.comments.sort((x, y) => x.create - y.create)
        commit(types.GET_DISCUSS, data.discuss)
        return data
      })
    },
    find ({ commit }, payload) {
      return api.discuss.find(payload).then(({ data }) => {
        if (data.list != null && Array.isArray(data.list)) {
          data.list = data.list.sort((x, y) => -x.update + y.update)
        }
        commit(types.GET_DISCUSS_LIST, data.list)
      })
    },
    update ({commit}, payload) {
      return api.discuss.update(payload).then(({ data }) => {
        return data
      })
    },
    create ({commit}, payload) {
      return api.discuss.create(payload).then(({ data }) => data.did)
    }
  }
}

export default store
