import * as types from '../types'
import api from '@/api'

const store = {
  namespaced: true,
  state: {
    list: [],
    problem: {},
    sum: 0
  },
  getters: {
    list: state => state.list,
    problem: state => state.problem,
    sum: state => state.sum
  },
  mutations: {
    [types.GET_PROBLEM]: (state, payload) => {
      state.problem = payload
    },
    [types.GET_PROBLEM_LIST]: (state, payload) => {
      state.list = payload
    },
    [types.GET_SUM_PROBLEM]: (state, payload) => {
      state.sum = payload
    },
    [types.DELETE_PROBLEM]: (state, { pid }) => {
      // 从列表里删除
      // 如果没有这一步，那么会出现：数据库里已经删除，但前端页面（不刷新的情况下）还有
      state.list = state.list.filter((p) => p.pid !== +pid)
    }
  },
  actions: {
    findOne ({ commit }, payload) {
      return api.problem.findOne(payload).then(({ data }) => {
        commit(types.GET_PROBLEM, data)
        return data
      })
    },
    find ({ commit }, payload) {
      return api.problem.find(payload).then(({ data }) => {
        commit(types.GET_PROBLEM_LIST, data.res.docs)
        commit(types.GET_SUM_PROBLEM, data.res.total)
      })
    },
    update ({commit}, payload) {
      return api.problem.update(payload)
    },
    create ({commit}, payload) {
      return api.problem.create(payload).then(({ data }) => data.pid)
    },
    delete ({commit}, payload) {
      return api.problem.delete(payload).then(() => {
        commit(types.DELETE_PROBLEM, payload)
      })
    }
  }
}

export default store
