import * as types from '../types'
import api from '@/api'
import { defineStore } from 'pinia'

export const useSolutionStore = defineStore('solution', {
  state: () => ({
    list: [],
    solution: null,
    sum: 0
  }),
  actions: {
    find (payload) {
      return api.solution.find(payload).then(({ data }) => {
        this.list = data.list.docs
        this.sum = data.list.total
      })
    },
    findOne (payload) {
      return api.solution.findOne(payload).then(({ data }) => {
        this.solution = data.solution
      })
    },
    create (payload) {
      return api.solution.create(payload)
    },
    clearSavedSolution () {
      this.solution = {}
    },
    clearCode () {
      this.solution.code = ''
    }
  }
})

const store = {
  namespaced: true,
  state: {
    list: [],
    solution: null,
    sum: 0
  },
  getters: {
    list: state => state.list,
    solution: state => state.solution,
    sum: state => state.sum
  },
  mutations: {
    [types.GET_SOLUTION]: (state, payload) => {
      state.solution = payload
    },
    [types.UPDATE_SOLUTION_LIST]: (state, payload) => {
      state.list = payload
    },
    [types.UPDATE_SUM_SOLUTIONS]: (state, payload) => {
      state.sum = payload
    }
  },
  actions: {
    find ({ commit }, payload) {
      return api.solution.find(payload).then(({ data }) => {
        commit(types.UPDATE_SOLUTION_LIST, data.list.docs)
        commit(types.UPDATE_SUM_SOLUTIONS, data.list.total)
      })
    },
    findOne ({ commit }, payload) {
      return api.solution.findOne(payload).then(({ data }) => {
        commit(types.GET_SOLUTION, data.solution)
      })
    },
    create ({ commit }, payload) {
      return api.solution.create(payload)
    }
  }
}

export default store
