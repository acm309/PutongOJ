import * as types from '../types'
import api from '@/api'
import { defineStore } from 'pinia'

export const useProblemStore = defineStore('problem', {
  state: () => ({
    list: [],
    problem: {},
    sum: 0,
    solved: []
  }),
  actions: {
    [types.GET_PROBLEM]: (payload) => {
      this.problem = payload
    },
    [types.GET_PROBLEM_LIST]: (payload) => {
      this.list = payload
    },
    [types.GET_PROBLEM_SOLVED]: (payload) => {
      this.solved = payload
    },
    [types.GET_SUM_PROBLEM]: (payload) => {
      this.sum = payload
    },
    [types.UPDATE_PROBLEM]: (payload) => {
      this.problem = payload
    },
    [types.DELETE_PROBLEM]: ({ pid }) => {
      // 从列表里删除
      // 如果没有这一步，那么会出现：数据库里已经删除，但前端页面（不刷新的情况下）还有
      this.list = this.list.filter((p) => p.pid !== +pid)
    },
    findOne (payload) {
      return api.problem.findOne(payload).then(({ data }) => {
        this.problem = data.problem
        return data
      })
    },
    find (payload) {
      return api.problem.find(payload).then(({ data }) => {
        this.list = data.list.docs
        this.sum = data.list.total
        this.solved = data.solved
      })
    },
    update (payload) {
      return api.problem.update(payload).then(({ data }) => {
        return data
      })
    },
    create (payload) {
      return api.problem.create(payload).then(({ data }) => data.pid)
    },
    delete (payload) {
      return api.problem.delete(payload).then(() => {
        this.list = this.list.filter((p) => p.pid !== +(payload.pid))
      })
    }
  }
})

const store = {
  namespaced: true,
  state: {
    list: [],
    problem: {},
    sum: 0,
    solved: []
  },
  getters: {
    list: state => state.list,
    problem: state => state.problem,
    sum: state => state.sum,
    solved: state => state.solved
  },
  mutations: {
    [types.GET_PROBLEM]: (state, payload) => {
      state.problem = payload
    },
    [types.GET_PROBLEM_LIST]: (state, payload) => {
      state.list = payload
    },
    [types.GET_PROBLEM_SOLVED]: (state, payload) => {
      state.solved = payload
    },
    [types.GET_SUM_PROBLEM]: (state, payload) => {
      state.sum = payload
    },
    [types.UPDATE_PROBLEM]: (state, payload) => {
      state.problem = payload
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
        commit(types.GET_PROBLEM, data.problem)
        return data
      })
    },
    find ({ commit }, payload) {
      return api.problem.find(payload).then(({ data }) => {
        commit(types.GET_PROBLEM_LIST, data.list.docs)
        commit(types.GET_SUM_PROBLEM, data.list.total)
        commit(types.GET_PROBLEM_SOLVED, data.solved)
      })
    },
    update ({commit}, payload) {
      return api.problem.update(payload).then(({ data }) => {
        return data
      })
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
