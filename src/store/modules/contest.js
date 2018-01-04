import * as types from '../types'
import api from '../../api.js'

const store = {
  namespaced: true,
  state: {
    list: [],
    sum: 0,
    one: {},
    overview: [],
    totalProblems: 0,
    problems: [],
    ranklist: [],
    first: []
  },
  getters: {
    list: state => state.list,
    sum: state => state.sum,
    one: state => state.one,
    overview: state => state.overview,
    totalProblems: state => state.totalProblems,
    problems: state => state.problems,
    ranklist: state => state.ranklist,
    first: state => state.first
  },
  mutations: {
    [types.UPDATE_CONTEST_LIST]: (state, payload) => {
      state.list = payload
    },
    [types.UPDATE_SUM_CONTEST]: (state, payload) => {
      state.sum = payload
    },
    [types.GET_CONTEST]: (state, payload) => {
      state.one = payload
    },
    [types.GET_CONTEST_OVERVIEW]: (state, payload) => {
      state.overview = payload
    },
    [types.GET_CONTEST_TOTAL_PRO]: (state, payload) => {
      state.totalProblems = payload
    },
    [types.GET_CONTEST_PRO]: (state, payload) => {
      state.problems = payload
    },
    [types.GET_CONTEST_RANK]: (state, payload) => {
      state.ranklist = payload
    },
    [types.GET_CONTEST_PRIME]: (state, payload) => {
      state.first = payload
    }
  },
  actions: {
    find ({ commit }, payload) {
      return api.contest.find(payload).then(({ data }) => {
        commit(types.UPDATE_CONTEST_LIST, data.res.docs)
        commit(types.UPDATE_SUM_CONTEST, data.total)
      })
    },
    findOne ({ commit }, payload) {
      return api.contest.findOne(payload).then(({ data }) => {
        commit(types.GET_CONTEST, data.doc)
        commit(types.GET_CONTEST_OVERVIEW, data.res)
        commit(types.GET_CONTEST_TOTAL_PRO, data.total)
        commit(types.GET_CONTEST_PRO, data.pro)
        return data.res
      })
    },
    getRank ({ commit }, payload) {
      return api.contest.rank(payload).then(({data}) => {
        commit(types.GET_CONTEST_RANK, data.res)
        commit(types.GET_CONTEST_PRIME, data.prime)
      })
    }
  }
}

export default store
