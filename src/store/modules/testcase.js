import * as types from '../types'
import api from '@/api'
import { defineStore } from 'pinia'

export const useTestcaseStore = defineStore('testcase', {
  state: () => ({
    list: [],
    testcase: {}
  }),
  actions: {
    async findOne (payload) {
      const {data} = await api.testcase.findOne(payload)
      this.testcase = data
    },
    async find (payload) {
      const {data} = await api.testcase.find(payload)
      this.list = data
      return data
    },
    create (payload) {
      return api.testcase.create(payload)
    },
    async delete (payload) {
      const {data} = await api.testcase.delete(payload)
      this.list = data
    }
  }
})

const store = {
  namespaced: true,
  state: {
    list: [],
    testcase: {}
  },
  getters: {
    list: state => state.list,
    testcase: state => state.testcase
  },
  mutations: {
    [types.UPDATE_TESTCASE]: (state, payload) => {
      state.testcase = payload
    },
    [types.UPDATE_TESTCASE_LIST]: (state, payload) => {
      state.list = payload
    },
    [types.DELETE_TESTCASE]: (state, payload) => {
      state.list = payload
    }
  },
  actions: {
    findOne ({ commit }, payload) {
      return api.testcase.findOne(payload).then(({ data }) => {
        commit(types.UPDATE_TESTCASE, data)
      })
    },
    find ({ commit }, payload) {
      return api.testcase.find(payload).then(({ data }) => {
        commit(types.UPDATE_TESTCASE_LIST, data)
        return data
      })
    },
    create ({commit}, payload) {
      return api.testcase.create(payload)
    },
    delete ({commit}, payload) {
      return api.testcase.delete(payload).then(({ data }) => {
        commit(types.DELETE_TESTCASE, data)
      })
    }
  }
}

export default store
