import * as types from '../types'
import api from '@/api'
import { defineStore } from 'pinia'

export const useRanklistStore = defineStore('ranklist', {
  state: () => ({
    list: [],
    sum: 0
  }),
  actions: {
    async find (payload) {
      const {data} = await api.getRanklist(payload)
      this.list = data.list.docs
      this.sum = data.list.total
    }
  }
})

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
        commit(types.UPDATE_RANKLIST, data.list.docs)
        commit(types.UPDATE_SUM_RANKLIST, data.list.total)
      })
    }
  }
}

export default store
